from fastapi import FastAPI, Query, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse
import re
import os
import json
import asyncio
import httpx
import tempfile
import subprocess
import glob
import random
import time
from datetime import datetime, timedelta, timezone
from dotenv import load_dotenv

# Optional dependency
try:
    import yt_dlp
except ImportError:
    yt_dlp = None

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

SESSION_COOKIE = os.getenv("SORA_SESSION_COOKIE", "")

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
    "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.8",
    "Referer": "https://sora.chatgpt.com/",
}

# ── YouTube Multi-Pool Keys (Dynamic) ───────────────────────────
def get_all_env_keys(prefixes):
    """Scan environment for multiple prefixes like YT_MAIN_KEY, RAPIDAPI_KEY..."""
    found = []
    if isinstance(prefixes, str):
        prefixes = [prefixes]
    
    for prefix in prefixes:
        # Check base
        base = os.getenv(prefix)
        if base: found.append(base)
        # Check suffixes
        for i in range(1, 101):
            k = os.getenv(f"{prefix}_{i}")
            if k: found.append(k)
    
    return list(dict.fromkeys(found)) # Remove duplicates

class KeyManager:
    def __init__(self, pool_name: str, env_prefixes: list = None):
        self.keys = []
        if env_prefixes:
            self.keys = get_all_env_keys(env_prefixes)
        
        self.index = 0
        print(f"[KeyManager] Initialized '{pool_name}' with {len(self.keys)} keys from {env_prefixes}.")
    
    def get_key(self):
        if not self.keys: return ""
        key = self.keys[self.index]
        self.index = (self.index + 1) % len(self.keys)
        return key

yt_main_manager = KeyManager("yt_main", ["YT_MAIN_KEY", "RAPIDAPI_KEY"])
dl_manager = KeyManager("downloader", ["YT_DL_KEY", "YT_MAIN_KEY", "RAPIDAPI_KEY"])
if not dl_manager.keys:
    dl_manager.keys = yt_main_manager.keys # Deep fallback

# ── TikTok Multi-Pool Keys ───────────────────────────────────
TIKTOK_KEYS = [k for k in [os.getenv(f'RAPIDAPI_KEY_{i}', '') for i in range(1, 16)] if k]
def get_tiktok_key():
    if not TIKTOK_KEYS: return ""
    # Simple rotation for TikTok keys matching server.py pattern
    key = TIKTOK_KEYS[0]
    TIKTOK_KEYS.append(TIKTOK_KEYS.pop(0))
    return key

def extract_video_id(url: str):
    for pattern in [r"/p/(s_[a-f0-9]+)", r"/p/([^/?#\s]+)"]:
        m = re.search(pattern, url)
        if m:
            return m.group(1)
    return None

def _ytdlp_installed() -> bool:
    return yt_dlp is not None

async def scrape_sora_page(url: str, cookies_str: str = None):
    headers = HEADERS.copy()
    if cookies_str:
        headers["Cookie"] = cookies_str
        
    async with httpx.AsyncClient(headers=headers, follow_redirects=True, timeout=15) as client:
        try:
            response = await client.get(url)
            if response.status_code != 200:
                return None
            
            html = response.text
            video_url = None
            title = None
            thumb = None
            
            og_video = re.search(r'<meta[^>]+property=["\']og:video["\'][^>]+content=["\']([^"\']+)["\']', html)
            if not og_video:
                og_video = re.search(r'<meta[^>]+content=["\']([^"\']+)["\'][^>]+property=["\']og:video["\']', html)
            if og_video:
                video_url = og_video.group(1)
            
            og_title = re.search(r'<meta[^>]+property=["\']og:title["\'][^>]+content=["\']([^"\']+)["\']', html)
            if og_title:
                title = og_title.group(1)
            
            og_image = re.search(r'<meta[^>]+property=["\']og:image["\'][^>]+content=["\']([^"\']+)["\']', html)
            if og_image:
                thumb = og_image.group(1)

            if not video_url:
                next_data_match = re.search(r'<script id="__NEXT_DATA__" type="application/json">(.+?)</script>', html)
                if next_data_match:
                    try:
                        data = json.loads(next_data_match.group(1))
                        page_props = data.get("props", {}).get("pageProps", {})
                        video_info = page_props.get("post", {}) or page_props.get("video", {})
                        video_url = video_info.get("video_url") or video_info.get("url")
                        if not video_url and "fallback_url" in video_info:
                            video_url = video_info["fallback_url"]
                        if not title:
                            title = video_info.get("title") or video_info.get("prompt")
                        if not thumb:
                            thumb = video_info.get("thumbnail_url") or video_info.get("preview_image_url")
                    except: pass

            if video_url:
                return {
                    "status": "success",
                    "title": title or "Sora AI Video",
                    "prompt": title or "",
                    "pic": thumb or "",
                    "videoUrl": video_url.replace("\\u0026", "&"),
                    "download_videoUrl": video_url.replace("\\u0026", "&"),
                    "method": "Scrape"
                }
        except: pass
    return None

def _run_ytdlp(url: str, cookies_path: str = None):
    if not yt_dlp:
        raise ImportError("yt-dlp is not installed")
    ydl_opts = {
        "quiet": True,
        "no_warnings": True,
        "skip_download": True,
        "format": "bestvideo+bestaudio/best",
        "user_agent": HEADERS["User-Agent"],
    }
    if cookies_path:
        ydl_opts["cookiefile"] = cookies_path
        
    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        return ydl.extract_info(url, download=False)

async def fetch_with_ytdlp(url: str, video_id: str, cookies_str: str = None):
    if not _ytdlp_installed():
        return None
    
    cookies_path = None
    if cookies_str:
        with tempfile.NamedTemporaryFile(mode='w', suffix='.txt', delete=False) as tf:
            tf.write("# Netscape HTTP Cookie File\n")
            for cookie in cookies_str.split(';'):
                if '=' in cookie:
                    try:
                        name, value = cookie.strip().split('=', 1)
                        tf.write(f".chatgpt.com\tTRUE\t/\tTRUE\t0\t{name}\t{value}\n")
                    except: pass
            cookies_path = tf.name

    try:
        info = await asyncio.to_thread(_run_ytdlp, url, cookies_path)
        if info:
            video_url = info.get("url") or info.get("webpage_url")
            formats = info.get("formats", [])
            if formats:
                best = sorted(
                    [f for f in formats if f.get("url") and f.get("vcodec") != "none"],
                    key=lambda f: f.get("height") or 0,
                    reverse=True
                )
                if best:
                    video_url = best[0].get("url", video_url)
            
            if video_url:
                return {
                    "status": "success",
                    "title": info.get("title") or info.get("id") or f"Sora Video {video_id[:10]}",
                    "prompt": info.get("description") or "",
                    "pic": info.get("thumbnail") or "",
                    "videoUrl": video_url,
                    "download_videoUrl": video_url,
                    "method": "yt-dlp"
                }
    except: pass
    finally:
        if cookies_path and os.path.exists(cookies_path):
            try: os.remove(cookies_path)
            except: pass
    return None

@app.post("/api/sora_down")
@app.get("/api/sora_down")
async def get_video(request: Request, url: str = Query(None)):
    cookies = None
    if request.method == "POST":
        try:
            payload = await request.json()
            url = payload.get("url", url)
            cookies = payload.get("cookies")
        except: pass
    
    if not url or "sora.chatgpt.com/p" not in url:
        return JSONResponse({"status": "error", "msg": "URL de vídeo Inválida."})
    
    video_id = extract_video_id(url)
    if not video_id:
        return JSONResponse({"status": "error", "msg": "Não foi possível extrair o ID."})
    
    # Priority 1: YT-DLP with cookies
    result = await fetch_with_ytdlp(url, video_id, cookies)
    if result: return JSONResponse(result)
    
    # Priority 2: Scraping with cookies
    result = await scrape_sora_page(url, cookies)
    if result: return JSONResponse(result)
    
    return JSONResponse({
        "status": "error", 
        "msg": "Vídeo não encontrado. Verifique se o link está correto ou se os Cookies são válidos."
    })
@app.post("/api/groq_proxy")
async def groq_proxy(request: Request):
    groq_key = request.headers.get("X-Groq-Key")
    if not groq_key:
        return JSONResponse({"status": "error", "msg": "Groq API Key missing"}, status_code=400)
    
    try:
        form_data = await request.form()
        files = {}
        data = {
            "model": "whisper-large-v3",
            "language": "pt",
            "response_format": "text"
        }
        
        for key, value in form_data.items():
            if hasattr(value, "file"):
                content = await value.read()
                files["file"] = (value.filename, content, value.content_type)
            
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.groq.com/openai/v1/audio/transcriptions",
                data=data,
                files=files,
                headers={"Authorization": f"Bearer {groq_key}"},
                timeout=120.0
            )
            
            if response.status_code == 200:
                return Response(content=response.text, media_type="text/plain")
            
            try:
                error_data = response.json()
                return JSONResponse(error_data, status_code=response.status_code)
            except:
                return JSONResponse({"status": "error", "msg": f"Groq Error: {response.status_code}", "raw": response.text}, status_code=response.status_code)
                
    except Exception as e:
        return JSONResponse({"status": "error", "msg": f"Groq Proxy Error: {str(e)}"}, status_code=500)

@app.post("/api/transcribe_proxy")
async def transcribe_proxy(request: Request):
    # Deprecated: io.net proxy kept for backward compatibility during migration
    ionet_key = request.headers.get("X-Ionet-Key")
    if not ionet_key:
        return JSONResponse({"status": "error", "msg": "io.net API Key missing"}, status_code=400)
    
    try:
        form_data = await request.form()
        files = {}
        data = {}
        for key, value in form_data.items():
            if hasattr(value, "file"):
                content = await value.read()
                files[key] = (value.filename, content, value.content_type)
            else:
                data[key] = value
                
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.intelligence.io.solutions/api/v1/audio/transcriptions",
                data=data,
                files=files,
                headers={
                    "Authorization": f"Bearer {ionet_key}",
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
                    "Accept": "*/*"
                },
                timeout=180.0
            )
            
            if response.status_code == 200:
                # Return raw text (Whisper 'text' format)
                return Response(content=response.text, media_type="text/plain")
            
            # Return JSON error from API
            try:
                error_data = response.json()
                # Inject key diagnostic for debugging 403
                if response.status_code in [401, 403]:
                    key_diag = {
                        "key_len": len(ionet_key),
                        "key_mask": f"{ionet_key[:2]}...{ionet_key[-2:]}" if len(ionet_key) > 4 else "too-short",
                        "service_msg": error_data.get("error", {}).get("message") or error_data.get("msg") or str(error_data)
                    }
                    return JSONResponse({"status": "error", "msg": "API Key is not valid for service", "diag": key_diag}, status_code=response.status_code)
                return JSONResponse(error_data, status_code=response.status_code)
            except:
                return JSONResponse({"status": "error", "msg": f"API Error: {response.status_code}", "raw": response.text}, status_code=response.status_code)
                
    except Exception as e:
        return JSONResponse({"status": "error", "msg": f"Proxy Error: {str(e)}"}, status_code=500)

@app.post("/api/prompt_proxy")
async def prompt_proxy(request: Request):
    mistral_key = request.headers.get("X-Mistral-Key")
    if not mistral_key:
        return JSONResponse({"status": "error", "msg": "Mistral API Key missing"}, status_code=400)
    
    try:
        data = await request.json()
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.mistral.ai/v1/chat/completions",
                json=data,
                headers={
                    "Authorization": f"Bearer {mistral_key}",
                    "Content-Type": "application/json"
                },
                timeout=90.0
            )
            return JSONResponse(response.json(), status_code=response.status_code)
    except Exception as e:
        return JSONResponse({"status": "error", "msg": f"Proxy Error: {str(e)}"}, status_code=500)
@app.get("/api/pinterest")
async def pinterest_download(download: str = Query(None), filename: str = Query(None)):
    if not download:
        return JSONResponse({"status": "error", "error": "URL de download ausente."}, status_code=400)
    
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Referer": "https://www.pinterest.com/",
    }
    
    # Simple proxy using httpx
    async def stream_file():
        async with httpx.AsyncClient(headers=headers, follow_redirects=True) as client:
            async with client.stream("GET", download) as resp:
                if resp.status_code != 200:
                    return
                async for chunk in resp.aiter_bytes():
                    yield chunk

    ext = "mp4" if ".mp4" in download else "gif" if ".gif" in download else "jpg"
    name = filename or f"pinterest_{int(time.time())}.{ext}"
    
    return StreamingResponse(
        stream_file(),
        media_type="application/octet-stream",
        headers={"Content-Disposition": f'attachment; filename="{name}"'}
    )

@app.post("/api/pinterest")
async def pinterest_data(request: Request):
    try:
        payload = await request.json()
        url = payload.get("url")
        if not url:
            return JSONResponse({"status": "error", "error": "URL não fornecida."}, status_code=400)
        
        if not yt_dlp:
            return JSONResponse({"status": "error", "error": "yt-dlp não está instalado."}, status_code=500)
            
        def _run_extract():
            ydl_opts = {
                "quiet": True,
                "no_warnings": True,
                "skip_download": True,
                "noplaylist": True,
                "sleep_interval_requests": 2,
                "extractor_retries": 3,
                "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                "http_headers": {
                    "Accept-Language": "pt-BR,pt;q=0.9",
                    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
                }
            }
            
            # Check for cookies.txt in the project root or environment variable
            cookies_path = os.path.join(os.getcwd(), "cookies.txt")
            if not os.path.exists(cookies_path):
                env_cookies = os.getenv("PINTEREST_COOKIES")
                if env_cookies:
                    with tempfile.NamedTemporaryFile(mode='w', suffix='.txt', delete=False) as tf:
                        tf.write(env_cookies)
                        cookies_path = tf.name
                        print("Using cookies from environment variable")

            if os.path.exists(cookies_path):
                ydl_opts["cookiefile"] = cookies_path
                print(f"Using cookies from: {cookies_path}")
                
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                return ydl.extract_info(url, download=False)
            
            # Clean up temp cookie file if created
            if cookies_path and cookies_path.endswith('.txt') and 'tmp' in cookies_path:
                try: os.remove(cookies_path)
                except: pass

        try:
            info = await asyncio.to_thread(_run_extract)
        except Exception as e:
            print(f"yt-dlp failed, trying HTML fallback: {str(e)}")
            # Fallback: Scrape HTML for metadata
            async with httpx.AsyncClient(headers=HEADERS, follow_redirects=True, timeout=15) as client:
                html_resp = await client.get(url)
                if html_resp.status_code == 200:
                    html = html_resp.text
                    # Try LD+JSON
                    ld_json_match = re.search(r'<script type="application/ld\+json">(.+?)</script>', html, re.DOTALL)
                    if ld_json_match:
                        try:
                            ld_data = json.loads(ld_json_match.group(1))
                            if isinstance(ld_data, list): ld_data = ld_data[0]
                            video_url = ld_data.get("contentUrl")
                            if video_url:
                                return {
                                    "type": "video",
                                    "title": ld_data.get("name", "Pinterest Video"),
                                    "thumbnail": ld_data.get("thumbnailUrl", ""),
                                    "pinId": url.split("/")[-2] if "/" in url else "pin",
                                    "videos": [{
                                        "label": "Original",
                                        "url": video_url,
                                        "width": 0, "height": 0, "format": "MP4"
                                    }],
                                    "images": [],
                                    "v": int(time.time()),
                                    "method": "HTML_Fallback"
                                }
                        except: pass
                    
                    # Try Meta Tags
                    og_video = re.search(r'<meta property="og:video" content="(.+?)">', html)
                    if og_video:
                        video_url = og_video.group(1)
                        return {
                            "type": "video",
                            "title": "Pinterest Video",
                            "thumbnail": "",
                            "pinId": "pin",
                            "videos": [{"label": "Original", "url": video_url, "width": 0, "height": 0, "format": "MP4"}],
                            "images": [], "v": int(time.time()), "method": "Meta_Fallback"
                        }
            
            # If both failed
            return JSONResponse({
                "status": "error", 
                "error": f"Erro yt-dlp: {str(e)}. Fallback também falhou.",
                "v": int(time.time()),
                "debug": "ytdlp_and_html_fail"
            }, status_code=500)
        
        if not info:
            return JSONResponse({"status": "error", "error": "Não foi possível extrair dados desse Pin."}, status_code=404)
        
        # Formata resposta compatível com o componente React
        videos = []
        images = []
        
        # Tenta pegar formatos mp4
        formats = info.get("formats", [])
        for f in formats:
            if f.get("ext") == "mp4" and f.get("url"):
                videos.append({
                    "label": f"{f.get('height', 'HD')}p" if f.get("height") else f.get("format_id", "MP4"),
                    "url": f.get("url"),
                    "width": f.get("width") or 0,
                    "height": f.get("height") or 0,
                    "format": "MP4"
                })
        
        # Se não achou vídeos mas tem URL direta
        if not videos and info.get("url") and not info.get("url").endswith(".jpg"):
            videos.append({
                "label": "Original",
                "url": info.get("url"),
                "width": info.get("width") or 0,
                "height": info.get("height") or 0,
                "format": "MP4"
            })
            
        # Imagens (Extrai da lista de thumbnails se for imagem)
        if not videos:
            images.append({
                "label": "Original",
                "url": info.get("url") or info.get("thumbnail"),
                "width": info.get("width") or 0,
                "height": info.get("height") or 0
            })
            
        return {
            "type": "video" if videos else "image",
            "title": info.get("title") or "Pinterest Pin",
            "thumbnail": info.get("thumbnail") or "",
            "pinId": info.get("id") or "",
            "videos": sorted(videos, key=lambda x: x.get("height", 0), reverse=True),
            "images": images,
            "v": int(time.time()),
        }
        
    except Exception as e:
        import time
        print(f"Pinterest Extraction Error: {str(e)}")
        return JSONResponse({
            "status": "error", 
            "error": f"Erro yt-dlp: {str(e)}",
            "v": int(time.time()),
            "debug": "ytdlp_fail"
        }, status_code=500)

@app.api_route("/api/download", methods=["GET", "POST"])
async def download_video(request: Request, url: str = Query(None), filename: str = Query("video.mp4"), height: str = Query("best")):
    # Extract data from body if POST
    if request.method == "POST":
        try:
            payload = await request.json()
            url = payload.get("url", url)
            filename = payload.get("filename", filename)
            height = payload.get("height", height)
        except Exception:
            pass

    if not url:
        return JSONResponse({"status": "error", "error": "URL não fornecida"}, status_code=400)

    async def run_ytdlp_cmd(f_str, tmpdir_path):
        output_template = os.path.join(tmpdir_path, "video.%(ext)s")
        cmd = [
            'yt-dlp',
            '-o', output_template,
            '-f', f_str,
            '--merge-output-format', 'mp4',
            '--no-playlist',
            '--remote-components', 'ejs:github',
            url
        ]
        
        try:
            # Vercel has 10-60s timeout depending on plan. 
            # We'll use 50s to be safe within a serverless function structure.
            process = await asyncio.create_subprocess_exec(
                *cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            try:
                stdout, stderr = await asyncio.wait_for(process.communicate(), timeout=55)
                return process.returncode, stdout.decode() if stdout else "", stderr.decode() if stderr else ""
            except asyncio.TimeoutError:
                try:
                    process.kill()
                except: pass
                return -1, "", "Timeout Expired"
        except Exception as e:
            return -1, "", str(e)

    async def download_task():
        with tempfile.TemporaryDirectory() as tmpdir:
            # 1. Tentativa com height específico
            if height and height != 'best' and height != '0':
                fmt = f'bestvideo[height<={height}][ext=mp4]+bestaudio[ext=m4a]/bestvideo[height<={height}]+bestaudio/best[height<={height}]/best'
            else:
                fmt = 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/bestvideo+bestaudio/best'

            print(f"[VERCEL DOWNLOAD] Iniciando: {url} | Fmt: {fmt}")
            ret, out, err = await run_ytdlp_cmd(fmt, tmpdir)
            files = glob.glob(os.path.join(tmpdir, "*"))

            # 2. Fallback "best" MP4
            if not files:
                print(f"[VERCEL FALLBACK] Tentativa 1 falhou. Motivo: {err[:150]}. Tentando 'best' MP4...")
                fallback_fmt = 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best'
                ret, out, err = await run_ytdlp_cmd(fallback_fmt, tmpdir)
                files = glob.glob(os.path.join(tmpdir, "*"))

            # 3. Fallback absoluto
            if not files:
                print(f"[VERCEL FALLBACK] Tentativa 2 falhou. Tentando 'best' absoluto...")
                ret, out, err = await run_ytdlp_cmd('best', tmpdir)
                files = glob.glob(os.path.join(tmpdir, "*"))

            if not files:
                # Se tudo falhar, retorna o erro
                print(f"[VERCEL ERROR] Todas as tentativas falharam: {err}")
                return None, err

            # Lê o arquivo para memória (Vercel serverless functions limit é ~4.5MB para resposta total as vezes, 
            # mas alguns planos permitem mais. Para arquivos muito grandes, isso pode falhar).
            with open(files[0], 'rb') as f:
                content = f.read()
            return content, files[0]

    content, fpath = await download_task()
    
    if content is None:
        return JSONResponse({"status": "error", "error": f"Falha no download: {fpath}"}, status_code=500)

    from fastapi.responses import Response
    return Response(
        content=content,
        media_type="video/mp4",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"'
        }
    )

# ── YouTube RapidAPI Proxy Routes ────────────────────────────

@app.get("/api/yt/status")
async def yt_status():
    return {
        "status": "online", 
        "pools": {
            "yt_main": len(yt_main_manager.keys),
            "downloader": len(dl_manager.keys)
        }
    }

@app.get("/api/yt/trending")
async def yt_trending(geo: str = "BR", cat: str = "", qty: int = 50):
    key = yt_main_manager.get_key()
    params = {
        "part": "snippet,statistics",
        "chart": "mostPopular",
        "regionCode": geo,
        "maxResults": str(min(qty, 50))
    }
    if cat:
        params["videoCategoryId"] = cat

    async with httpx.AsyncClient() as client:
        try:
            resp = await client.get(
                "https://youtube-v31.p.rapidapi.com/videos",
                params=params,
                headers={"X-RapidAPI-Key": key, "X-RapidAPI-Host": "youtube-v31.p.rapidapi.com"},
                timeout=20.0
            )
            data = resp.json()
            if resp.status_code != 200:
                # Normalizing the error response for the frontend
                return JSONResponse({
                    "error": f"YouTube API Error {resp.status_code}",
                    "details": data.get("message") or data.get("error") or str(data),
                    "code": resp.status_code
                }, status_code=resp.status_code)
            return JSONResponse(data, status_code=200)
        except Exception as e:
            return JSONResponse({"error": f"Proxy Exception: {str(e)}"}, status_code=500)

@app.get("/api/yt/search")
async def yt_search(
    q: str = "", 
    lang: str = "", 
    after: str = "", 
    before: str = "", 
    duration: str = "any", 
    order: str = "relevance", 
    qty: int = 50
):
    key = yt_main_manager.get_key()
    params = {
        "q": q,
        "part": "snippet,id",
        "maxResults": str(min(qty, 50)),
        "order": order,
        "type": "video"
    }
    if lang: params["relevanceLanguage"] = lang
    if after: params["publishedAfter"] = after
    if before: params["publishedBefore"] = before
    if duration and duration != "any": params["videoDuration"] = duration

    async with httpx.AsyncClient() as client:
        try:
            resp = await client.get(
                "https://youtube-v31.p.rapidapi.com/search",
                params=params,
                headers={"X-RapidAPI-Key": key, "X-RapidAPI-Host": "youtube-v31.p.rapidapi.com"},
                timeout=25.0
            )
            data = resp.json()
            if resp.status_code != 200:
                return JSONResponse({
                    "error": f"YouTube Search Error {resp.status_code}",
                    "details": data.get("message") or data.get("error") or str(data),
                    "code": resp.status_code
                }, status_code=resp.status_code)
            return JSONResponse(data, status_code=200)
        except Exception as e:
            return JSONResponse({"error": f"Search Proxy Exception: {str(e)}"}, status_code=500)

@app.get("/api/yt/video")
async def yt_video_details(id: str):
    key = yt_main_manager.get_key()
    async with httpx.AsyncClient() as client:
        try:
            resp = await client.get(
                "https://youtube-v31.p.rapidapi.com/videos",
                params={"part": "snippet,statistics,contentDetails", "id": id},
                headers={"X-RapidAPI-Key": key, "X-RapidAPI-Host": "youtube-v31.p.rapidapi.com"},
                timeout=20.0
            )
            data = resp.json()
            if resp.status_code != 200:
                return JSONResponse({
                    "error": f"YouTube Video Error {resp.status_code}",
                    "details": data.get("message") or data.get("error") or str(data),
                    "code": resp.status_code
                }, status_code=resp.status_code)
            return JSONResponse(data, status_code=200)
        except Exception as e:
            return JSONResponse({"error": f"Video Proxy Exception: {str(e)}"}, status_code=500)

@app.get("/api/yt/channel")
async def yt_channel_details(id: str):
    key = yt_main_manager.get_key()
    async with httpx.AsyncClient() as client:
        try:
            resp = await client.get(
                "https://youtube-v31.p.rapidapi.com/channels",
                params={"part": "snippet,statistics,brandingSettings", "id": id},
                headers={"X-RapidAPI-Key": key, "X-RapidAPI-Host": "youtube-v31.p.rapidapi.com"},
                timeout=20.0
            )
            data = resp.json()
            if resp.status_code != 200:
                return JSONResponse({
                    "error": f"YouTube Channel Error {resp.status_code}",
                    "details": data.get("message") or data.get("error") or str(data),
                    "code": resp.status_code
                }, status_code=resp.status_code)
            return JSONResponse(data, status_code=200)
        except Exception as e:
            return JSONResponse({"error": f"Channel Proxy Exception: {str(e)}"}, status_code=500)

@app.get("/api/yt/download")
async def yt_dl_info(id: str):
    key = dl_manager.get_key()
    async with httpx.AsyncClient() as client:
        try:
            # Novo host conforme solicitado
            resp = await client.get(
                "https://youtube-media-downloader.p.rapidapi.com/v2/video/details",
                params={"videoId": id},
                headers={"X-RapidAPI-Key": key, "X-RapidAPI-Host": "youtube-media-downloader.p.rapidapi.com"},
                timeout=20.0
            )
            data = resp.json()
            if resp.status_code != 200:
                return JSONResponse({
                    "error": f"YouTube Downloader Error {resp.status_code}",
                    "details": data.get("message") or data.get("error") or str(data),
                    "code": resp.status_code
                }, status_code=resp.status_code)
            return JSONResponse(data, status_code=200)
        except Exception as e:
            return JSONResponse({"error": f"Download Proxy Exception: {str(e)}"}, status_code=500)

# ── PHANTOM Outlier Scanner ─────────────────────────────────

NICHE_TRANSLATIONS = {
    "true crime": "true crime",
    "finanças pessoais": "personal finance",
    "curiosidades": "curiosities facts",
    "terror": "horror stories",
    "motivação": "motivation",
    "geopolítica": "geopolitics",
    "tecnologia": "tech news",
    "saúde": "health tips",
    "mistérios": "mysteries",
    "worship music": "worship music",
    "história": "history facts",
    "animais": "animal facts",
    "ciência": "science facts",
    "fatos": "facts",
    "top 10": "top 10",
    "psicologia": "psychology",
    "compilação": "compilation",
    "relaxamento": "relaxation",
    "asmr": "asmr",
}

# ── PHANTOM FACELESS KEYWORDS (520+ TOTAL) ───────────────────
FACELESS_KEYWORDS = [
    "narrated documentary", "voiceover explained", "dark narration facts", "unsolved mysteries narrated", "true crime narration",
    "cold cases narrated", "shocking facts narration", "mind blowing narrated", "serial killer narration", "conspiracy narrated",
    "hidden secrets narrated", "untold stories narration", "bizarre facts narrated", "creepy narration", "disturbing facts narrated",
    "forbidden knowledge narration", "scary stories narrated", "passive income narrated", "wealth secrets narration", "investing explained narrated",
    "financial freedom narration", "money habits narrated", "rich mindset narration", "stock market explained narrated", "crypto secrets narration",
    "side hustle narrated", "manipulation tactics narrated", "narcissist exposed narration", "human behavior narrated", "dark psychology explained",
    "toxic relationship narration", "gaslighting explained narrated", "sociopath signs narration", "trauma explained narrated", "mind control narration",
    "psychological tricks narrated", "war crimes narration", "empire collapse narrated", "secret history narration", "forgotten wars narrated",
    "ancient civilization narration", "historical mysteries narrated", "dark history narration", "geopolitics explained narrated", "conspiracy history narration",
    "world war secrets narrated", "things you didnt know narrated", "top 10 dark facts narrated", "iceberg explained narrated", "scary truth narration",
    "unknown facts narrated", "world secrets narration", "shocking truth narrated", "hidden knowledge narration", "facts that will shock you narrated",
    "space facts narrated", "universe explained narration", "science facts narrated", "technology explained narration", "ai explained narrated",
    "future predictions narrated", "tech secrets narration", "quantum explained narrated", "physics explained narration", "biology facts narrated",
    "criminal psychology narrated", "fbi secrets narration", "cia declassified narrated", "government secrets narration", "surveillance exposed narrated",
    "propaganda explained narration", "political corruption narrated", "world power secrets narrated", "elite exposed narration", "dark web explained narrated",
    "internet mysteries narration", "hacking explained narrated", "digital secrets narration", "privacy invasion narrated", "censored truth narration",
    "banned knowledge narrated", "deleted history narration", "plane crash investigation narrated", "disaster explained narration", "natural disaster facts narrated",
    "earthquake secrets narration", "volcano explained narrated", "survival scenarios narrated", "apocalypse explained narration", "extinction events narrated",
    "pandemic secrets narration", "medical mysteries narrated", "pharmaceutical exposed narrated", "healing secrets narration", "food industry exposed narration",
    "sugar industry secrets narrated", "longevity secrets narrated", "military secrets narrated", "weapon technology narration", "nuclear secrets narrated",
    "cold war secrets narrated", "spy stories narration", "intelligence agency narrated", "assassinations explained narration", "false flag narrated",
    "psychological warfare narration", "celebrity exposed narrated", "hollywood secrets narration", "music industry dark narrated", "disney secrets narration",
    "entertainment dark side narrated", "famous deaths narration", "mysterious celebrity narrated", "illuminati explained narration", "secret society narrated",
    "freemason secrets narration", "ancient egypt narrated", "lost civilization narration", "pyramid secrets narrated", "extraterrestrial facts narrated",
    "ufo declassified narrated", "area 51 secrets narrated", "nasa hidden narrated", "ocean mysteries narrated", "deep sea secrets narration",
    "bermuda triangle narration", "shipwreck mysteries narrated", "ghost ships narrated", "abandoned places narration", "paranormal explained narrated",
    "supernatural facts narrated", "cryptid explained narration", "bigfoot evidence narrated", "mythical creatures narrated", "mythology explained narration",
    "greek myths narrated", "norse legends narration", "religion exposed narrated", "church secrets narration", "cult explained narrated",
    "brainwashing tactics narration", "sect secrets narrated", "religious corruption narrated", "drug cartel narrated", "mafia secrets narration",
    "organized crime narrated", "gang history narration", "underworld exposed narrated", "drug trade explained narration", "money laundering narrated",
    "crime boss narration", "heist explained narrated", "unsolved disappearance narrated", "missing persons narration", "abduction cases narrated",
    "human trafficking narrated", "dark tourism narration", "death row narrated", "prison system exposed narrated", "criminal justice dark narration",
    "forensic science narration", "autopsy facts narrated", "body language secrets narration", "lie detection narrated", "interrogation tactics narration",
    "police corruption narrated", "detective methods narration", "criminal profiling narrated", "behavioral analysis narration", "predator psychology narration",
    "stalker behavior narrated", "obsession psychology narration", "abandoned projects narrated", "suppressed technology narrated", "inventor betrayed narrated",
    "stolen ideas narration", "corporate theft narrated", "industrial espionage narrated", "whistleblower stories narrated", "leaked documents narration",
    "classified information narrated", "state secrets narration", "declassified files narrated", "cover up exposed narrated", "silenced voices narrated",
    "animal facts dark narrated", "nature documentary narration", "predator prey narrated", "wildlife secrets narrated", "extinct animal narration",
    "evolution explained narrated", "genetics explained narrated", "cloning explained narrated", "bioethics dark narrated", "human experimentation narration",
    "medical experiment narrated", "mkultra explained narrated", "mind control history narrated", "dream meaning explained narrated", "subconscious facts narration",
    "sleep secrets narrated", "hypnosis explained narration", "subliminal messages narrated", "memory manipulation narration", "false memory narrated",
    "consciousness explained narration", "simulation theory narration", "multiverse explained narrated", "quantum reality narration", "time travel explained narrated",
    "black hole facts narration", "dark matter narrated", "cosmic facts narrated", "star death narrated", "mars secrets narrated", "moon secrets narration",
    "asteroid threat narration", "survival tips narrated", "prepper secrets narration", "off grid living narrated", "bushcraft explained narrated",
    "wilderness survival narration", "disaster prep narrated", "doomsday explained narrated", "collapse scenario narrated", "civilization fall narration",
    "grid down narration", "water purification narrated", "food storage narration", "famine history narrated", "food shortage narration",
    "poverty exposed narration", "housing crisis narrated", "class system dark narration", "apartheid history narration", "segregation history narrated",
    "civil rights dark narration", "protest history narrated", "revolution history narration", "coup explained narration", "dictator exposed narration",
    "authoritarian secrets narrated", "totalitarian history narration", "censorship history narration", "book burning history narrated", "forbidden art narrated",
    "censored film narration", "suppressed music narrated", "counterculture history narrated", "underground movement narrated", "resistance history narration",
    "partisan warfare narrated", "terrorism explained narration", "radicalization explained narrated", "extremism psychology narration", "gang psychology narrated",
    "prison gang narration", "organized crime history narration", "mob boss narrated", "cartel operations narration", "drug lord story narrated",
    "smuggling history narrated", "black market explained narration", "haunted location narrated", "ghost town history narration", "abandoned city narrated",
    "chernobyl explained narrated", "nuclear disaster narration", "industrial disaster narration", "oil spill history narrated", "toxic waste narrated",
    "environmental crime narrated", "species extinction narrated", "deforestation dark narration", "ocean plastic narration", "microplastic facts narrated",
    "drinking water crisis narration", "poison water narrated", "chemical exposure narrated", "pesticide dark narration", "gmo exposed narrated",
    "processed food dark narration", "fast food secrets narrated", "sugar addiction narration", "junk food exposed narrated", "diet industry dark narration",
    "weight loss secrets narrated", "eating disorder facts narrated", "body image dark narration", "social comparison narrated", "beauty standard dark narration",
    "cosmetic industry exposed narrated", "plastic surgery dark narration", "identity crisis explained narrated", "existential crisis narration", "meaning of life narrated",
    "nihilism explained narration", "absurdism facts narrated", "mortality facts narration", "death explained narrated", "afterlife theories narration",
    "stoicism explained narrated", "philosophy explained narrated", "stoic wisdom narration", "marcus aurelius narrated", "nietzsche explained narration",
    "human potential narrated", "success habits narration", "productivity secrets narration", "cognitive bias narrated", "logical fallacies narration",
    "critical thinking narrated", "propaganda analysis narration", "media manipulation narrated", "fake news exposed narration", "social media manipulation narrated",
    "algorithm secrets narration", "big tech exposed narrated", "google secrets narration", "facebook exposed narrated", "youtube algorithm narrated",
    "tiktok secrets narration", "attention economy narrated", "dopamine hijack narration", "addiction explained narrated", "screen addiction narration",
    "education system exposed narrated", "school system dark narration", "college debt exposed narrated", "university secrets narration", "academic fraud narrated",
    "vietnam war secrets narration", "iraq war exposed narrated", "afghanistan dark narration", "ww2 secrets narration", "ww1 dark history narrated",
    "civil war secrets narration", "roman empire dark narrated", "mongol empire narration", "ottoman secrets narrated", "british empire dark narration",
    "colonial history narrated", "slavery history narration", "genocide explained narrated", "holocaust facts narration", "massacre history narrated",
    "death penalty narrated", "wrongful conviction narration", "dna evidence narrated", "crime lab secrets narration", "victimology explained narrated",
    "wealth gap explained narrated", "billionaire secrets narration", "corporate corruption narrated", "wall street dark narration", "stock manipulation narrated",
    "ponzi scheme explained narration", "financial collapse narrated", "economic crisis narration", "inflation explained narrated", "bank secrets narration",
    "self improvement narrated", "discipline habits narrated", "mental models narrated", "decision making narration", "deep work narration",
    "time management narrated", "morning routine explained narrated", "atomic habits narrated", "focus secrets narration", "social engineering narrated",
    "phishing explained narration", "identity theft narrated", "cybercrime narration", "ransomware explained narrated", "darknet markets narration",
    "anonymous hacker narrated", "zero day exploit narration", "malware history narrated", "data breach secrets narration", "surveillance capitalism narrated",
    "birth order psychology narrated", "sibling rivalry dark narration", "family trauma narrated", "generational trauma narration", "childhood trauma narrated",
    "attachment theory narration", "abandonment psychology narrated", "codependency explained narration", "emotional abuse narrated", "coercive control narration",
    "domestic violence psychology narrated", "victim mentality narration", "learned helplessness narrated", "resilience psychology narration", "post traumatic growth narrated",
    "therapy secrets narration", "psychiatry dark narrated", "overmedication exposed narration", "mental health industry narrated", "therapist abuse narration",
    "sleep deprivation effects narrated", "insomnia explained narration", "circadian rhythm narrated", "lucid dreaming explained narration", "sleep paralysis narrated",
    "night terror facts narration", "chronic pain psychology narrated", "placebo effect narration", "nocebo explained narrated", "psychosomatic illness narration",
    "gut brain connection narrated", "microbiome secrets narration", "autoimmune mystery narrated", "inflammation secrets narration", "fasting explained narrated",
    "caloric restriction narration", "carnivore diet explained narrated", "vegan industry dark narration", "supplement industry exposed narrated", "vitamin secrets narration",
    "ancient trade routes narrated", "silk road history narration", "spice trade secrets narrated", "piracy golden age narration", "privateer history narrated",
    "corsair stories narration", "viking raids narrated", "crusade dark history narration", "inquisition secrets narrated", "witch trial history narration",
    "burning times narrated", "heresy explained narration", "excommunication history narrated", "papal corruption narration", "medieval torture narrated",
    "dungeon secrets narration", "castle siege history narrated", "feudal system dark narration", "peasant revolt narrated", "plague history narration",
    "black death secrets narrated", "epidemic history narration", "quarantine history narrated", "hospital ship narration", "medical ship history narrated",
    "battlefield medicine narration", "war injury history narrated", "trench warfare narration", "poison gas history narrated", "chemical weapon narration",
    "sleep music voiceover", "relaxing facts narrated", "meditation explained narration", "calm story narrated", "ambient knowledge narration",
    "background learning narrated", "bedtime facts narration", "night facts narrated", "quiet narration explained", "soothing documentary narrated",
    "travel mystery narrated", "city secrets narration", "underground city narrated", "hidden tunnel narration", "catacomb history narrated",
    "bunker history narration", "secret passage narrated", "castle mystery narration", "palace secrets narrated", "royal family dark narration",
    "monarchy exposed narrated", "aristocracy secrets narration", "noble family dark narrated", "dynasty collapse narration", "throne wars narrated",
    "succession crisis narration", "heir mystery narrated", "royal murder narration", "king poisoned narrated", "empress secrets narration",
    "witch doctor explained narrated", "voodoo history narration", "shamanism explained narrated", "ritual facts narration", "ceremony dark history narrated",
    "sacrifice history narration", "temple secrets narrated", "oracle history narration", "propaganda explained narrated", "divination history narration",
    "tarot history narrated", "astrology dark narration", "numerology explained narrated", "sacred geometry narration", "esoteric knowledge narrated",
    "occult history narration", "hermetic secrets narrated", "alchemy explained narration", "philosopher stone narrated", "ancient wisdom narration",
    "lost knowledge narrated", "suppressed wisdom narration", "ancient technology narrated", "megalith mystery narration", "stonehenge secrets narrated",
    "nazca lines explained narration", "easter island narrated", "puma punku narration", "gobekli tepe secrets narrated", "catalhoyuk history narration",
    "sumerian history narrated", "babylonian secrets narration", "akkadian empire narrated", "assyrian dark history narration", "persian empire narrated",
    "macedonian empire narration", "alexander secrets narrated", "carthage history narration", "hannibal strategy narrated", "rome dark history narration",
    "ai reconstruction history narrated", "city reconstruction ai voiceover", "what looked like narrated", "ancient city ai reconstruction", "historical reconstruction narration",
    "how city looked narrated", "ai generated history explained", "lost city reconstruction narrated", "historical documentary ai narration", "civilization reconstruction voiceover",
    "ancient world ai narrated", "history brought alive narration", "medieval city reconstruction narrated", "empire history ai explained", "forgotten city narrated",
    "ancient street reconstruction narration", "historical walkthrough ai narrated", "city through time narrated", "history visual reconstruction narration", "ancient civilization walkthrough narrated",
    "roman city reconstruction narrated", "greek city ai narration", "medieval town reconstruction voiceover", "victorian city narrated ai", "industrial revolution reconstruction narrated",
    "war reconstruction ai narration", "empire fall reconstruction narrated", "ancient egypt reconstruction narration", "renaissance city narrated ai", "colonial city reconstruction narrated",
    "viking settlement reconstruction narration", "persian empire reconstruction narrated", "ottoman empire ai narrated", "mongol empire reconstruction narration", "aztec city reconstruction narrated",
    "inca civilization ai narration", "maya city reconstruction narrated", "babylon reconstruction ai narration", "carthage city narrated", "pompeii reconstruction narrated",
    "constantinople reconstruction narration", "silk road reconstruction narrated", "ancient rome walkthrough narration", "athens reconstruction ai narrated", "sparta reconstruction narrated",
    "ancient japan reconstruction narration", "samurai era reconstruction narrated", "feudal japan ai narration", "edo period reconstruction narrated", "dynasty china reconstruction narration",
    "ming dynasty reconstruction narrated", "tang dynasty ai narration", "ancient india reconstruction narrated", "mughal empire reconstruction narration", "delhi sultanate narrated ai",
    "ancient africa reconstruction narration", "mali empire reconstruction narrated", "songhai empire ai narration", "great zimbabwe reconstruction narrated", "carthage empire narration ai",
    "new amsterdam reconstruction narrated", "colonial america reconstruction narration", "puritan settlement narrated ai", "revolutionary war reconstruction narrated", "civil war reconstruction narration",
    "wild west reconstruction narrated", "gold rush reconstruction narration", "great depression reconstruction narrated", "1900s city reconstruction narration", "1920s city reconstruction narrated",
    "1930s city narrated ai", "1940s wartime reconstruction narration", "1800s city reconstruction narrated", "1700s colonial reconstruction narration", "1600s settlement reconstruction narrated",
    "1500s exploration reconstruction narration", "1400s medieval reconstruction narrated", "ancient port city reconstruction narration", "ancient market reconstruction narrated", "ancient palace reconstruction narration",
    "ancient temple reconstruction narrated", "ancient harbor reconstruction narration", "ancient road reconstruction narrated", "ancient bridge reconstruction narration", "ancient wall city narrated",
    "ancient forum reconstruction narration", "ancient colosseum reconstruction narrated", "ancient amphitheater narration", "ancient aqueduct reconstruction narrated", "ancient bath reconstruction narration",
    "ancient library reconstruction narrated", "lost kingdom reconstruction narration", "lost empire ai narrated", "sunken city reconstruction narration", "abandoned city reconstruction narrated",
    "destroyed city reconstruction narration", "bombed city reconstruction narrated", "wartime city reconstruction narration", "siege reconstruction history narrated", "battle reconstruction ai narration",
    "naval battle reconstruction narrated", "cavalry charge reconstruction narration", "historical military reconstruction narrated", "ancient army reconstruction narration", "legions march reconstruction narrated",
    "what happened narrated history", "truth behind history narrated", "untold history reconstruction narration", "dark history reconstruction narrated", "secret history reconstruction narration",
    "hidden history reconstruction narrated", "real history revealed narration", "history they dont teach narrated", "history changed world narration", "pivotal moment history narrated",
    "turning point history narration", "history mystery explained narrated", "historical event reconstruction narration", "day changed history narrated", "moment history narration ai",
    "year changed world narrated", "decade reconstruction history narration", "century reconstruction history narrated", "era reconstruction history narration", "age reconstruction history narrated",
    "kingdom fall reconstruction narration", "dynasty collapse narrated ai", "empire collapse reconstruction narration", "civilization collapse narrated", "society collapse reconstruction narration",
    "famine reconstruction history narrated", "plague reconstruction history narration", "revolution reconstruction history narrated", "uprising reconstruction history narration", "conquest reconstruction history narrated",
    "invasion reconstruction history narration", "migration reconstruction history narrated", "exploration reconstruction history narration", "discovery reconstruction history narrated", "invention reconstruction history narration",
    "innovation history reconstruction narrated", "trade route reconstruction narration", "ancient economy reconstruction narrated", "ancient politics reconstruction narration", "ancient religion reconstruction narrated",
    "ancient culture reconstruction narration", "ancient daily life narrated", "how people lived narrated history", "life ancient times narration", "everyday ancient history narrated"
]

@app.get("/api/yt/phantom")
async def yt_phantom_scan(niche: str = "true crime", lang: str = "pt"):
    """
    Full pipeline: search videos → extract channels → fetch channel stats.
    Returns enriched channel data for the Phantom Outlier dashboard.
    """
    try:
        search_niche = niche.lower()
        if lang == "en":
            search_niche = NICHE_TRANSLATIONS.get(search_niche, search_niche)

        # Calculate 180 days ago for publishedAfter filter (UTC aware)
        now = datetime.now(timezone.utc)
        published_after = (now - timedelta(days=180)).strftime("%Y-%m-%dT%H:%M:%SZ")

        # Rotation logic: pick 12 random faceless keywords (optimized for speed)
        faceless_sample = random.sample(FACELESS_KEYWORDS, 12)
        
        queries = []
        if lang == "pt":
            queries = [
                f"{search_niche} canal faceless",
                f"{search_niche} documentário narrado",
                f"{search_niche} curiosidades fatos",
                f"{search_niche} mistérios casos reais",
                f"{search_niche} história explicada"
            ]
            queries += [f"{search_niche} {kw}" for kw in faceless_sample[:7]]
        else:
            queries = [f"{search_niche} {kw}" for kw in faceless_sample[:8]]
            queries += [kw for kw in faceless_sample[8:]] 

        all_video_items = []
        errors = []

        async with httpx.AsyncClient(timeout=15.0) as client:
            # Step 1: Search for videos (Parallelized for Speed)
            tasks = []
            for q in queries[:10]: 
                key = yt_main_manager.get_key()
                if not key:
                    errors.append("No API Key found")
                    continue
                tasks.append(client.get(
                    "https://youtube-v31.p.rapidapi.com/search",
                    params={
                        "q": q,
                        "part": "snippet",
                        "maxResults": "50",
                        "order": "date", 
                        "type": "video",
                        "publishedAfter": published_after,
                        "regionCode": "BR" if lang == "pt" else "US",
                        "relevanceLanguage": lang,
                    },
                    headers={"X-RapidAPI-Key": key, "X-RapidAPI-Host": "youtube-v31.p.rapidapi.com"},
                ))
            
            responses = await asyncio.gather(*tasks, return_exceptions=True)
            for resp in responses:
                if isinstance(resp, Exception):
                    errors.append(str(resp)[:40])
                    continue
                if resp.status_code == 200:
                    all_video_items.extend(resp.json().get("items", []))
                elif resp.status_code == 429:
                    errors.append("Quota 429")

            # Step 2: Extract unique channel IDs
            channel_ids_set = set()
            channel_video_map = {}
            for item in all_video_items:
                snippet = item.get("snippet", {})
                cid = snippet.get("channelId", "")
                if cid:
                    channel_ids_set.add(cid)
                    if cid not in channel_video_map:
                        channel_video_map[cid] = []
                    channel_video_map[cid].append({
                        "title": snippet.get("title", ""),
                        "thumbnail": snippet.get("thumbnails", {}).get("high", {}).get("url") or "",
                        "publishedAt": snippet.get("publishedAt", ""),
                    })

            unique_channel_ids = list(channel_ids_set)[:100]

            # Step 3: Batch fetch channel details (2 batches of 50)
            channels_data = []
            if unique_channel_ids:
                batch_tasks = []
                for i in range(0, len(unique_channel_ids), 50):
                    batch = unique_channel_ids[i:i+50]
                    key = yt_main_manager.get_key()
                    batch_tasks.append(client.get(
                        "https://youtube-v31.p.rapidapi.com/channels",
                        params={
                            "part": "snippet,statistics,brandingSettings",
                            "id": ",".join(batch),
                        },
                        headers={"X-RapidAPI-Key": key, "X-RapidAPI-Host": "youtube-v31.p.rapidapi.com"},
                    ))
                
                batch_responses = await asyncio.gather(*batch_tasks, return_exceptions=True)
                for r in batch_responses:
                    if not isinstance(r, Exception) and r.status_code == 200:
                        channels_data.extend(r.json().get("items", []))

        # Step 4: Build enriched channel objects
        result_channels = []
        for ch in channels_data:
            stats = ch.get("statistics", {})
            subs = int(stats.get("subscriberCount", 0))
            views = int(stats.get("viewCount", 0))
            vids = int(stats.get("videoCount", 0))

            # REMOVED sub limit completely for broad discovery, or set to 1M
            if subs > 1000000 or vids < 1: continue 

            snippet = ch.get("snippet", {})
            avg_v = views // max(vids, 1)
            if avg_v < 1: continue # Catch even the smallest traction

            result_channels.append({
                "channelId": ch.get("id"),
                "name": snippet.get("title", ""),
                "handle": snippet.get("customUrl", ""),
                "avatar": snippet.get("thumbnails", {}).get("medium", {}).get("url") or "",
                "description": snippet.get("description", "")[:200],
                "subscribers": subs,
                "totalViews": views,
                "videoCount": vids,
                "avgViews": avg_v,
                "country": snippet.get("country", ""),
                "publishedAt": snippet.get("publishedAt", ""),
                "topVideos": channel_video_map.get(ch.get("id"), [])[:6],
            })

        result_channels.sort(key=lambda c: c.get("avgViews", 0), reverse=True)

        return {
            "channels": result_channels[:100],
            "totalFound": len(result_channels),
            "niche": niche,
            "lang": lang,
            "errors": errors if errors else None,
        }
    except Exception as e:
        return JSONResponse({"error": f"Phantom Engine Error: {str(e)}"}, status_code=500)

# ── TikTok Hub Migration ─────────────────────────────────────

def tiktok_num(v):
    if isinstance(v, (int, float)): return int(v)
    if not v: return 0
    s = str(v).upper().strip()
    if s.endswith('K'): return int(float(s[:-1]) * 1000)
    if s.endswith('M'): return int(float(s[:-1]) * 1000000)
    if s.endswith('B'): return int(float(s[:-1]) * 1000000000)
    return int(re.sub(r'[^0-9]', '', s) or 0)

async def fetch_posts_rapidapi(username: str):
    keys = TIKTOK_KEYS.copy()
    import random
    random.shuffle(keys)
    async with httpx.AsyncClient() as client:
        for key in keys:
            try:
                r = await client.get(
                    f'https://tiktok-scraper7.p.rapidapi.com/user/posts?unique_id={username}&count=20',
                    headers={
                        'x-rapidapi-host': 'tiktok-scraper7.p.rapidapi.com',
                        'x-rapidapi-key': key,
                    },
                    timeout=15.0
                )
                if r.status_code == 429: continue
                if r.status_code == 200:
                    j = r.json()
                    d = j.get('data', {})
                    if isinstance(d, list): return d
                    if isinstance(d, dict):
                        return d.get('videos') or d.get('aweme_list') or d.get('list') or d.get('data') or []
            except: continue
    return []

@app.get("/api/tiktok_analytics")
async def tiktok_analytics(u: str = Query(...)):
    username = u.replace('@', '').strip()
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://www.tikwm.com/',
        'Accept': 'application/json',
    }

    async with httpx.AsyncClient(headers=headers, timeout=15.0) as client:
        # 1. User Info
        info_json = {}
        try:
            info_res = await client.get(f'https://www.tikwm.com/api/user/info?unique_id={username}')
            info_json = info_res.json()
        except: pass
        
        user_data = info_json.get('data', {})
        user_info = user_data.get('user', user_data)
        stats_info = user_data.get('stats', {})
        follower_count = tiktok_num(stats_info.get('followerCount') or stats_info.get('fans') or user_info.get('followerCount'))

        # 2. Posts (TikWM)
        raw_videos = []
        for url in [
            f'https://www.tikwm.com/api/user/posts?unique_id={username}&count=20',
            f'https://www.tikwm.com/api/user/posts?unique_id={username}&count=20&cursor=0&web=1',
        ]:
            try:
                r = await client.get(url)
                if r.status_code == 200 and 'Just a moment' not in r.text:
                    j = r.json()
                    d = j.get('data', {})
                    if isinstance(d, list) and d: raw_videos = d; break
                    elif isinstance(d, dict):
                        vids = d.get('videos') or d.get('aweme_list') or d.get('list') or d.get('data') or []
                        if vids: raw_videos = vids; break
            except: pass

        # 3. Fallback RapidAPI
        if not raw_videos and TIKTOK_KEYS:
            raw_videos = await fetch_posts_rapidapi(username)

        def extract_tags(vids):
            tags = {}
            for v in vids:
                desc = v.get('title') or v.get('desc') or ''
                for tag in re.findall(r'#[a-zA-Z0-9_\u00C0-\u00FF]+', desc):
                    clean = tag[1:].lower()
                    tags[clean] = tags.get(clean, 0) + 1
            return sorted([{'name': k, 'count': v} for k, v in tags.items()], key=lambda x: -x['count'])[:15]

        videos_list = []
        for v in raw_videos:
            likes = tiktok_num(v.get('digg_count') or v.get('diggCount'))
            comments = tiktok_num(v.get('comment_count') or v.get('commentCount'))
            shares = tiktok_num(v.get('share_count') or v.get('shareCount'))
            eng_rate = ((likes + comments + shares) / follower_count * 100) if follower_count > 0 else 0
            videos_list.append({
                'id': str(v.get('video_id') or v.get('id') or ''),
                'desc': v.get('title') or v.get('desc') or '',
                'plays': tiktok_num(v.get('play_count') or v.get('playCount')),
                'likes': likes, 'comments': comments, 'shares': shares,
                'create_date': v.get('create_time') or v.get('createTime') or 0,
                'engRate': round(eng_rate, 4),
            })

        analytics = None
        if videos_list:
            total_likes = sum(vd['likes'] for vd in videos_list)
            total_comments = sum(vd['comments'] for vd in videos_list)
            total_shares = sum(vd['shares'] for vd in videos_list)
            total_plays = sum(vd['plays'] for vd in videos_list)
            n = len(videos_list)
            avg_eng = ((total_likes + total_comments + total_shares) / (n * follower_count) * 100) if follower_count > 0 else 0
            eng_mult = max(0.1, avg_eng / 5)
            analytics = {
                'engagementRates': {
                    'total_rate': avg_eng,
                    'likes_rate': (total_likes / (n * follower_count) * 100) if follower_count > 0 else 0,
                    'comments_rate': (total_comments / (n * follower_count) * 100) if follower_count > 0 else 0,
                    'shares_rate': (total_shares / (n * follower_count) * 100) if follower_count > 0 else 0,
                },
                'performance': {
                    'avgViews': round(total_plays / n),
                    'avgLikes': round(total_likes / n),
                    'avgComments': round(total_comments / n),
                    'avgShares': round(total_shares / n),
                },
                'dataset': [vd['engRate'] for vd in videos_list[:10]],
                'videos': videos_list,
                'hashtags': extract_tags(videos_list),
                'earnings': {
                    'min': round(follower_count * 0.002 * eng_mult * 0.7),
                    'max': round(follower_count * 0.002 * eng_mult * 1.3),
                }
            }

        return {
            'author': {
                'uniqueId': user_info.get('uniqueId', username),
                'nickname': user_info.get('nickname', username),
                'avatarThumb': user_info.get('avatarThumb') or user_info.get('avatar_thumb') or '',
                'signature': user_info.get('signature') or '',
                'verified': bool(user_info.get('verified')),
            },
            'stats': {
                'followerCount': follower_count,
                'followingCount': tiktok_num(stats_info.get('followingCount') or user_info.get('followingCount')),
                'heartCount': tiktok_num(stats_info.get('heartCount') or stats_info.get('heart') or user_info.get('heartCount')),
                'videoCount': tiktok_num(stats_info.get('videoCount') or user_info.get('videoCount')),
            },
            'analytics': analytics,
            'raw_source': 'vercel_migrated_v1',
        }

@app.get("/api/tiktok_video")
async def tiktok_video(url: str = Query(None), video_id: str = Query(None)):
    if url and not video_id:
        match = re.search(r'/video/(\d{15,20})', url)
        if match: video_id = match.group(1)
        else:
            match = re.search(r'\b(\d{15,20})\b', url)
            if match: video_id = match.group(1)

    if not video_id:
        return JSONResponse({'error': 'URL inválida ou video_id não encontrado'}, status_code=422)

    async with httpx.AsyncClient(timeout=15.0) as client:
        # TikWM
        try:
            r = await client.get(f'https://www.tikwm.com/api/?url=https://www.tiktok.com/video/{video_id}&web=1&hd=1')
            if r.status_code == 200:
                d = r.json().get('data', {})
                if d and (d.get('play_count') is not None):
                    return {
                        'video_id': video_id,
                        'desc': d.get('title') or d.get('desc') or '',
                        'stats': {
                            'play_count': tiktok_num(d.get('play_count') or d.get('playCount')),
                            'like_count': tiktok_num(d.get('digg_count') or d.get('diggCount')),
                        },
                        'author': {'unique_id': d.get('author', {}).get('unique_id') or d.get('author', {}).get('uniqueId') or ''},
                        'source': 'tikwm_vercel'
                    }
        except: pass

        # RapidAPI Fallback
        keys = TIKTOK_KEYS.copy()
        import random
        random.shuffle(keys)
        for key in keys:
            try:
                r = await client.get(
                    f'https://tiktok-scraper7.p.rapidapi.com/video/info?url=https://www.tiktok.com/video/{video_id}',
                    headers={'x-rapidapi-host': 'tiktok-scraper7.p.rapidapi.com', 'x-rapidapi-key': key}
                )
                if r.status_code == 200:
                    d = r.json().get('data', {})
                    if d:
                        stats = d.get('stats') or d
                        return {
                            'video_id': video_id,
                            'desc': d.get('desc') or d.get('title') or '',
                            'stats': {'play_count': tiktok_num(stats.get('playCount'))},
                            'source': 'rapidapi_vercel'
                        }
            except: continue

    return JSONResponse({'error': 'Não foi possível buscar dados do vídeo'}, status_code=502)

# ── Facebook Hub Migration ──────────────────────────────────

@app.post("/api/facebook")
async def facebook_metadata(request: Request):
    try:
        payload = await request.json()
        url = payload.get("url")
        if not url:
            return JSONResponse({"status": "error", "error": "URL não fornecida."}, status_code=400)
        
        def _run_fb_extract():
            import yt_dlp
            ydl_opts = {
                "quiet": True,
                "no_warnings": True,
                "skip_download": True,
                "format": "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best"
            }
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                return ydl.extract_info(url, download=False)

        info = await asyncio.to_thread(_run_fb_extract)
        
        videos = [
            {
                'label': str(f.get('height', '?')) + 'p',
                'url': f['url'],
                'width': f.get('width', 0),
                'height': f.get('height', 0),
                'format': 'MP4'
            }
            for f in info.get('formats', [])
            if f.get('ext') == 'mp4' and f.get('url')
        ]
        if not videos and info.get('url'):
            videos = [{'label': 'Original', 'url': info['url'], 'format': 'MP4'}]

        return {
            'type': 'video',
            'title': info.get('title', 'Facebook Video'),
            'thumbnail': info.get('thumbnail', ''),
            'id': info.get('id', ''),
            'videos': videos,
        }
    except Exception as e:
        return JSONResponse({"error": str(e)}, status_code=500)

# ── AI Image Proxies Migration ────────────────────────────────

@app.post("/api/openai-image")
async def openai_image_proxy(request: Request):
    api_key = os.getenv('OPENAI_API_KEY')
    if not api_key:
        return JSONResponse({'error': 'OpenAI API Key não configurada na Vercel'}, status_code=500)
    
    try:
        data = await request.json()
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                'https://api.openai.com/v1/images/generations',
                headers={
                    'Content-Type': 'application/json',
                    'Authorization': f'Bearer {api_key}'
                },
                json={
                    "model": "dall-e-3",
                    "prompt": data.get("prompt"),
                    "n": 1,
                    "size": data.get("size", "1024x1024"),
                    "quality": "standard"
                },
                timeout=120.0
            )
            
            if resp.status_code != 200:
                try:
                    return JSONResponse(resp.json(), status_code=resp.status_code)
                except:
                    return JSONResponse({'error': f'Erro na OpenAI: {resp.status_code}'}, status_code=resp.status_code)
            
            return JSONResponse(resp.json())
    except Exception as e:
        return JSONResponse({'error': str(e)}, status_code=500)

@app.get("/api/proxy-image")
async def proxy_image(url: str = Query(...)):
    headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}
    async with httpx.AsyncClient(headers=headers, follow_redirects=True) as client:
        try:
            resp = await client.get(url, timeout=25.0)
            if resp.status_code == 200 and len(resp.content) > 100:
                return Response(
                    resp.content,
                    media_type=resp.headers.get('Content-Type', 'image/jpeg'),
                    headers={
                        "Cache-Control": "public, max-age=3600",
                        "Access-Control-Allow-Origin": "*"
                    }
                )
            return JSONResponse({'error': 'not_ready'}, status_code=202)
        except Exception as e:
            return JSONResponse({'error': str(e)}, status_code=500)

# ── Evolink AI Video Migration ────────────────────────────────

EVOLINK_MODELS = [
    { "id": "doubao-seedance-1.0-pro-fast", "provider": "BytePlus (Seedance)", "price": "$0.019/s", "modes": ["T2V", "I2V"], "duration": "2–12s", "quality": ["480p","720p","1080p"], "note": "⭐ Melhor custo-benefício" },
    { "id": "seedance-1.5-pro", "provider": "BytePlus (Seedance)", "price": "$0.025/s", "modes": ["T2V", "I2V", "FLF"], "duration": "4–12s", "quality": ["480p","720p","1080p"], "note": "Áudio nativo (voz, SFX, música)" },
    { "id": "kling-v3-text-to-video", "provider": "Kling", "price": "$0.075/s", "modes": ["T2V"], "duration": "3–15s", "quality": ["720p","1080p"], "note": "Multi-shot + efeitos sonoros" },
    { "id": "kling-v3-image-to-video", "provider": "Kling", "price": "$0.075/s", "modes": ["I2V"], "duration": "3–15s", "quality": ["720p","1080p"], "note": "First/last frame" },
    { "id": "kling-o3-text-to-video", "provider": "Kling", "price": "$0.075/s", "modes": ["T2V"], "duration": "3–15s", "quality": ["720p","1080p"], "note": "Multi-shot avançado" },
    { "id": "kling-o3-image-to-video", "provider": "Kling", "price": "$0.075/s", "modes": ["I2V"], "duration": "3–15s", "quality": ["720p","1080p"], "note": "First/last/reference frame" },
    { "id": "wan2.5-text-to-video", "provider": "Alibaba (Wan)", "price": "$0.071/s", "modes": ["T2V"], "duration": "2–15s", "quality": ["720p","1080p"] },
    { "id": "wan2.5-image-to-video", "provider": "Alibaba (Wan)", "price": "$0.071/s", "modes": ["I2V"], "duration": "5s ou 10s", "quality": ["480p","720p","1080p"] },
    { "id": "wan2.6-text-to-video", "provider": "Alibaba (Wan)", "price": "$0.071/s", "modes": ["T2V"], "duration": "2–15s", "quality": ["720p","1080p"], "note": "Suporta audio_url" },
    { "id": "wan2.6-image-to-video", "provider": "Alibaba (Wan)", "price": "$0.071/s", "modes": ["I2V"], "duration": "3–15s", "quality": ["720p","1080p"] },
    { "id": "veo-3.1-fast-generate-preview", "provider": "Google (Veo)", "price": "$0.169/vídeo", "modes": ["T2V", "I2V"], "duration": "4/6/8s", "quality": ["720p","1080p","4K"], "note": "Áudio opcional, alta qualidade" },
    { "id": "veo-3.1-generate-preview", "provider": "Google (Veo)", "price": "$0.169/vídeo", "modes": ["T2V", "I2V"], "duration": "4/6/8s", "quality": ["720p","1080p","4K"], "note": "Versão Pro do Veo 3.1" },
    { "id": "sora-2-preview", "provider": "OpenAI (Sora)", "price": "$0.080/s", "modes": ["T2V", "I2V"], "duration": "4/8/12s", "quality": ["720p","1080p"], "note": "Moderação rígida" },
    { "id": "sora-2-pro-preview", "provider": "OpenAI (Sora)", "price": "$0.240/s", "modes": ["T2V", "I2V"], "duration": "4/8/12s", "quality": ["720p","1080p"], "note": "Qualidade profissional" },
    { "id": "MiniMax-Hailuo-02", "provider": "MiniMax (Hailuo)", "price": "$0.250/vídeo", "modes": ["T2V", "I2V", "FLF"], "duration": "6s ou 10s", "quality": ["512p","768p","1080p"], "note": "15 comandos de câmera" },
    { "id": "MiniMax-Hailuo-2.3", "provider": "MiniMax (Hailuo)", "price": "$0.250/vídeo", "modes": ["T2V", "I2V"], "duration": "6s ou 10s", "quality": ["768p","1080p"], "note": "Qualidade máxima MiniMax" },
    { "id": "grok-imagine-video", "provider": "xAI (Grok)", "price": "$0.064/vídeo", "modes": ["T2V", "I2V"], "duration": "6–10s", "note": "Estilos: fun / normal / spicy" },
    { "id": "omnihuman-1.5", "provider": "BytePlus (OmniHuman)", "price": "$0.167/s", "modes": ["Avatar"], "duration": "baseado no áudio", "note": "Lip-sync: foto + áudio → vídeo falante" },
]

@app.api_route("/api/evolink", methods=["GET", "POST"])
async def evolink_proxy(request: Request, action: str = Query(None), taskId: str = Query(None)):
    api_key = os.getenv('EVOLINK_API_KEY')
    if not api_key:
        return JSONResponse({'error': 'EVOLINK_API_KEY não configurada na Vercel'}, status_code=500)
    
    headers = {"Content-Type": "application/json", "Authorization": f"Bearer {api_key}"}
    base_url = "https://api.evolink.ai/v1"

    async with httpx.AsyncClient(headers=headers, timeout=120.0) as client:
        try:
            if action == "models":
                return {"models": EVOLINK_MODELS}

            if action == "generate" and request.method == "POST":
                body = await request.json()
                resp = await client.post(f"{base_url}/videos/generations", json=body)
                data = resp.json()
                if resp.status_code != 200: return JSONResponse(data, status_code=resp.status_code)
                return {
                    "task_id": data.get("id"),
                    "status": data.get("status"),
                    "model": data.get("model"),
                    "estimated_time": data.get("task_info", {}).get("estimated_time"),
                    "credits_reserved": data.get("usage", {}).get("credits_reserved"),
                }

            if action == "status" and taskId:
                resp = await client.get(f"{base_url}/tasks/{taskId}")
                data = resp.json()
                if resp.status_code != 200: return JSONResponse(data, status_code=resp.status_code)
                
                result = {
                    "task_id": data.get("id"),
                    "status": data.get("status"),
                    "progress": data.get("progress", 0),
                    "model": data.get("model"),
                }
                if data.get("status") == "completed":
                    result["video_url"] = data.get("results", [None])[0]
                    result["all_results"] = data.get("results", [])
                if data.get("status") == "failed":
                    result["error"] = data.get("error", "Falha desconhecida")
                return result

            return JSONResponse({"error": "Ação inválida. Use actions: models, generate, status"}, status_code=400)
        except Exception as e:
            return JSONResponse({"error": str(e)}, status_code=500)

# ── Songs Hub Migration ─────────────────────────────────────

FALLBACK_SONGS = [
    { "rank":1,  "title":"Pega Allí, Vol. 10",           "artist":"Taanga Producciones",              "duration":"0:17", "cover":None },
    { "rank":2,  "title":"Pyre (STEM synth)",             "artist":"Altitude Music / BMGPM",           "duration":"1:00", "cover":None },
    { "rank":3,  "title":"Self Aware",                    "artist":"Temper City",                      "duration":"0:29", "cover":None },
    { "rank":4,  "title":"Something Just Like This",      "artist":"The Chainsmokers & Coldplay",      "duration":"1:00", "cover":None },
    { "rank":5,  "title":"The Dark Sorcerers Trial",      "artist":"Perfect, So Dystopian",            "duration":"2:24", "cover":None },
    { "rank":6,  "title":"Lacrimosa",                     "artist":"Jairos & Isabel",                  "duration":"1:00", "cover":None },
    { "rank":7,  "title":"Tenderness",                    "artist":"Elia Lo Monaco",                   "duration":"1:00", "cover":None },
    { "rank":8,  "title":"Cabelo Loirinho",               "artist":"cjnobeat & Mc Morena",             "duration":"0:15", "cover":None },
    { "rank":9,  "title":"Gorof (Elixir)",                "artist":"Dur Dur Band",                     "duration":"0:30", "cover":None },
    { "rank":10, "title":"Bad Reputation",                "artist":"Joan Jett",                        "duration":"1:00", "cover":None },
    { "rank":11, "title":"Moonlight",                     "artist":"XXXTENTACION",                     "duration":"1:00", "cover":None },
    { "rank":12, "title":"Roller Coaster",                "artist":"narr",                             "duration":"1:00", "cover":None },
    { "rank":13, "title":"Golden",                        "artist":"HUNTR/X & EJAE",                   "duration":"1:00", "cover":None },
    { "rank":14, "title":"Eu Mato Ela",                   "artist":"MC NANINHA & JK NO BEAT",          "duration":"1:00", "cover":None },
    { "rank":15, "title":"are you ready?",                "artist":"NEU SONG.",                        "duration":"1:00", "cover":None },
]

@app.get("/api/songs")
async def songs(country: str = "BR"):
    # Note: vercel-kv is skipped for now to avoid extra dependencies, 
    # we return fallback as the original JS does if KV fails.
    return {
        "songs": FALLBACK_SONGS,
        "updatedAt": datetime.now(timezone.utc).isoformat().replace('+00:00', 'Z'),
        "country": country.upper(),
        "total": len(FALLBACK_SONGS),
        "source": "migrated_fallback",
    }
