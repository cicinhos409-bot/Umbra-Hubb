from fastapi import FastAPI, Query, Request, File, UploadFile, Form, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import re
import os
import json
import asyncio
import httpx
from dotenv import load_dotenv

import tempfile

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

def extract_video_id(url: str):
    for pattern in [r"/p/(s_[a-f0-9]+)", r"/p/([^/?#\s]+)"]:
        m = re.search(pattern, url)
        if m:
            return m.group(1)
    return None

def _ytdlp_installed() -> bool:
    try:
        import yt_dlp
        return True
    except ImportError:
        return False

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
    import yt_dlp
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
