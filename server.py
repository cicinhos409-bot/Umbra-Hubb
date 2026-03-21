from flask import Flask, request, jsonify, Response, send_file
from flask_cors import CORS
import subprocess, json, requests, tempfile, os, time, random

app = Flask(__name__)
# Enable CORS for the Vercel frontend (Simplified for debugging)
CORS(app)

import logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@app.route('/api/health')
def health_check():
    return jsonify({"status": "ok", "timestamp": time.time(), "railway": True})

@app.route('/')
def home():
    return "Umbra Hub API is Online", 200

import re
from datetime import datetime

RAPIDAPI_KEYS = [k for k in [os.environ.get(f'RAPIDAPI_KEY_{i}', '') for i in range(1, 16)] if k]

def fetch_posts_rapidapi(username):
    """Busca posts usando rotação de chaves RapidAPI se o TikWM falhar"""
    keys = RAPIDAPI_KEYS.copy()
    random.shuffle(keys)
    for key in keys:
        try:
            r = requests.get(
                f'https://tiktok-scraper7.p.rapidapi.com/user/posts?unique_id={username}&count=20',
                headers={
                    'x-rapidapi-host': 'tiktok-scraper7.p.rapidapi.com',
                    'x-rapidapi-key': key,
                },
                timeout=12
            )
            print(f'[RAPIDAPI] status={r.status_code} key=...{key[-6:]}', flush=True)
            if r.status_code == 429: # Rate limit atingido para esta key
                continue
            if r.status_code == 200:
                j = r.json()
                d = j.get('data', {})
                if isinstance(d, list) and d: return d
                elif isinstance(d, dict):
                    vids = d.get('videos') or d.get('aweme_list') or d.get('list') or d.get('data') or []
                    if vids: return vids
        except Exception as e:
            print(f'[RAPIDAPI ERROR] {e}', flush=True)
    return []

@app.route('/api/tiktok_analytics')
def tiktok_analytics():
    logger.info(f"Request received for user: {request.args.get('u')}")
    username = request.args.get('u', '').replace('@', '').strip()
    if not username:
        return jsonify({'error': 'Parâmetro ?u= necessário'}), 400

    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://www.tikwm.com/',
        'Accept': 'application/json',
    }

    # User info
    info_res = requests.get(f'https://www.tikwm.com/api/user/info?unique_id={username}', headers=headers, timeout=10)
    info_json = info_res.json()
    user_data = info_json.get('data', {})
    user = user_data.get('user', user_data)
    stats = user_data.get('stats', {})

    def num(v):
        if isinstance(v, (int, float)): return int(v)
        if not v: return 0
        s = str(v).upper().strip()
        if s.endswith('K'): return int(float(s[:-1]) * 1000)
        if s.endswith('M'): return int(float(s[:-1]) * 1000000)
        if s.endswith('B'): return int(float(s[:-1]) * 1000000000)
        return int(re.sub(r'[^0-9]', '', s) or 0)

    follower_count = num(stats.get('followerCount') or stats.get('fans') or user.get('followerCount'))

    # 2. Posts — Tentar tikwm primeiro (grátis/ilimitado)
    raw_videos = []
    for url in [
        f'https://www.tikwm.com/api/user/posts?unique_id={username}&count=20',
        f'https://www.tikwm.com/api/user/posts?unique_id={username}&count=20&cursor=0&web=1',
    ]:
        try:
            r = requests.get(url, headers=headers, timeout=12)
            print(f'[TIKWM] {url} → {r.status_code} | {r.text[:150]}', flush=True)
            if r.status_code == 200 and r.text.strip() and 'Just a moment' not in r.text:
                j = r.json()
                d = j.get('data', {})
                if isinstance(d, list) and d: raw_videos = d; break
                elif isinstance(d, dict):
                    vids = d.get('videos') or d.get('aweme_list') or d.get('list') or d.get('data') or []
                    if vids: raw_videos = vids; break
        except Exception as e:
            print(f'[TIKWM ERROR] {e}', flush=True)

    # 3. Fallback para RapidAPI com Rotação (se tikwm falhou)
    if not raw_videos and RAPIDAPI_KEYS:
        print(f'[RAPIDAPI] Iniciando fallback com rotação para @{username}...', flush=True)
        raw_videos = fetch_posts_rapidapi(username)

    print(f'[POSTS TOTAL] {len(raw_videos)} videos encontrados', flush=True)

    def extract_hashtags(videos):
        tags = {}
        for v in videos:
            desc = v.get('title') or v.get('desc') or ''
            for tag in re.findall(r'#[a-zA-Z0-9_\u00C0-\u00FF]+', desc):
                clean = tag[1:].lower()
                tags[clean] = tags.get(clean, 0) + 1
        return sorted([{'name': k, 'count': v} for k, v in tags.items()], key=lambda x: -x['count'])[:15]

    def extract_mentions(videos):
        mentions = {}
        for v in videos:
            desc = v.get('title') or v.get('desc') or ''
            for m in re.findall(r'@[a-zA-Z0-9._]+', desc):
                clean = m[1:].lower()
                if len(clean) > 1:
                    mentions[clean] = mentions.get(clean, 0) + 1
        return sorted([{'name': k, 'count': v} for k, v in mentions.items()], key=lambda x: -x['count'])[:10]

    videos_list = []
    for v in raw_videos:
        likes = num(v.get('digg_count') or v.get('diggCount'))
        comments = num(v.get('comment_count') or v.get('commentCount'))
        shares = num(v.get('share_count') or v.get('shareCount'))
        eng_rate = ((likes + comments + shares) / follower_count * 100) if follower_count > 0 else 0
        videos_list.append({
            'id': str(v.get('video_id') or v.get('id') or ''),
            'desc': v.get('title') or v.get('desc') or '',
            'plays': num(v.get('play_count') or v.get('playCount')),
            'likes': likes, 'comments': comments, 'shares': shares,
            'create_date': v.get('create_time') or v.get('createTime') or 0,
            'engRate': round(eng_rate, 4),
        })

    analytics = None
    if videos_list:
        total_likes = sum(v['likes'] for v in videos_list)
        total_comments = sum(v['comments'] for v in videos_list)
        total_shares = sum(v['shares'] for v in videos_list)
        total_plays = sum(v['plays'] for v in videos_list)
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
            'dataset': [v['engRate'] for v in videos_list[:10]],
            'videos': videos_list,
            'hashtags': extract_hashtags(videos_list),
            'mentions': extract_mentions(videos_list),
            'earnings': {
                'min': round(follower_count * 0.002 * eng_mult * 0.7),
                'max': round(follower_count * 0.002 * eng_mult * 1.3),
            }
        }

    return jsonify({
        'author': {
            'uniqueId': user.get('uniqueId', username),
            'nickname': user.get('nickname', username),
            'avatarThumb': user.get('avatarThumb') or user.get('avatar_thumb') or '',
            'signature': user.get('signature') or '',
            'verified': bool(user.get('verified')),
        },
        'stats': {
            'followerCount': follower_count,
            'followingCount': num(stats.get('followingCount') or user.get('followingCount')),
            'heartCount': num(stats.get('heartCount') or stats.get('heart') or user.get('heartCount')),
            'videoCount': num(stats.get('videoCount') or user.get('videoCount')),
        },
        'analytics': analytics,
        'raw_source': 'tikwm_railway_final',
    })

def convert_cookies_to_netscape(raw_cookies: str) -> str:
    """Converte cookies no formato header HTTP para Netscape"""
    if raw_cookies.startswith('# Netscape HTTP Cookie File'):
        return raw_cookies
    lines = ['# Netscape HTTP Cookie File']
    for cookie in raw_cookies.split(';'):
        cookie = cookie.strip()
        if '=' not in cookie:
            continue
        name, _, value = cookie.partition('=')
        name = name.strip()
        value = value.strip()
        lines.append(f'.youtube.com\tTRUE\t/\tTRUE\t9999999999\t{name}\t{value}')
    return '\n'.join(lines)

@app.route('/api/pinterest', methods=['POST'])
def pinterest():
    url = request.json.get('url')
    if not url:
        return jsonify({'error': 'URL não fornecida'}), 400

    result = subprocess.run(
        ['yt-dlp', '--dump-json', '--no-playlist',
         '-f', 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best',
         url],
        capture_output=True, text=True, timeout=30
    )

    if result.returncode != 0:
        return jsonify({'error': result.stderr}), 500

    info = json.loads(result.stdout)
    videos = [
        {
            'label': str(f.get('height','?'))+'p',
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

    return jsonify({
        'type': 'video',
        'title': info.get('title', 'Pinterest Video'),
        'thumbnail': info.get('thumbnail', ''),
        'pinId': info.get('id', ''),
        'videos': videos,
        'images': []
    })

@app.route('/api/facebook', methods=['POST'])
def facebook():
    url = request.json.get('url')
    if not url:
        return jsonify({'error': 'URL não fornecida'}), 400

    result = subprocess.run(
        ['yt-dlp', '--dump-json', '--no-playlist',
         '-f', 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best',
         url],
        capture_output=True, text=True, timeout=30
    )

    if result.returncode != 0:
        return jsonify({'error': result.stderr}), 500

    info = json.loads(result.stdout)
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

    return jsonify({
        'type': 'video',
        'title': info.get('title', 'Facebook Video'),
        'thumbnail': info.get('thumbnail', ''),
        'pinId': info.get('id', ''),
        'videos': videos,
        'images': []
    })

@app.route('/api/youtube', methods=['POST'])
def youtube():
    data = request.json
    url = data.get('url')
    cookies_raw = data.get('cookies', '')
    if not url:
        return jsonify({'error': 'URL não fornecida'}), 400

    with tempfile.TemporaryDirectory() as tmpdir:
        cookies_file = os.path.join(tmpdir, 'cookies.txt')
        if cookies_raw:
            cookies_netscape = convert_cookies_to_netscape(cookies_raw)
            with open(cookies_file, 'w', encoding='utf-8') as f:
                f.write(cookies_netscape)
        else:
            cookies_file = '/app/youtube_cookies.txt'

        result = subprocess.run(
            ['yt-dlp', '--dump-json', '--no-playlist',
             '--remote-components', 'ejs:github',
             '--cookies', cookies_file,
             url],
            capture_output=True, text=True, timeout=60
        )

    if result.returncode != 0:
        return jsonify({'error': result.stderr}), 500

    info = json.loads(result.stdout)
    
    vistas = sorted(
        [f for f in info.get('formats', []) if f.get('ext') == 'mp4' and f.get('height')],
        key=lambda x: x.get('height', 0),
        reverse=True
    )
    
    seen = set()
    videos = []
    for f in vistas:
        h = f.get('height', 0)
        if h not in seen:
            seen.add(h)
            videos.append({
                'label': str(h) + 'p',
                'url': f['url'],
                'width': f.get('width', 0),
                'height': h,
                'format': 'MP4'
            })

    if not videos and info.get('url'):
        videos = [{'label': 'Original', 'url': info['url'], 'format': 'MP4'}]

    return jsonify({
        'type': 'video',
        'title': info.get('title', 'YouTube Video'),
        'thumbnail': info.get('thumbnail', ''),
        'pinId': info.get('id', ''),
        'videos': videos,
        'images': []
    })

@app.route('/api/download', methods=['GET', 'POST'])
def download():
    if request.method == 'POST':
        data = request.json
        original_url = data.get('url')
        filename = data.get('filename', 'video.mp4')
        height = data.get('height', 'best')
        cookies_raw = data.get('cookies', '')
    else:
        original_url = request.args.get('url')
        filename = request.args.get('filename', 'video.mp4')
        height = request.args.get('height', 'best')
        cookies_raw = ''

    if not original_url:
        return 'URL não fornecida', 400

    import glob

    with tempfile.TemporaryDirectory() as tmpdir:
        cookies_file = os.path.join(tmpdir, 'cookies.txt')
        if cookies_raw:
            cookies_netscape = convert_cookies_to_netscape(cookies_raw)
            with open(cookies_file, 'w', encoding='utf-8') as f:
                f.write(cookies_netscape)
        else:
            cookies_file = '/app/youtube_cookies.txt'

        output_template = os.path.join(tmpdir, 'video.%(ext)s')

        if height and height != 'best' and height != '0':
            fmt = f'bestvideo[height<={height}][ext=mp4]+bestaudio[ext=m4a]/bestvideo[height<={height}]+bestaudio/best[height<={height}]/best'
        else:
            fmt = 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/bestvideo+bestaudio/best'

        result = subprocess.run(
            [
                'yt-dlp',
                '-o', output_template,
                '-f', fmt,
                '--merge-output-format', 'mp4',
                '--no-playlist',
                '--remote-components', 'ejs:github',
                '--cookies', cookies_file,
                original_url
            ],
            capture_output=True, text=True, timeout=120
        )

        files = glob.glob(os.path.join(tmpdir, '*'))
        if not files:
            return jsonify({'error': 'Falha: ' + result.stderr}), 500

        with open(files[0], 'rb') as f:
            file_data = f.read()

        return Response(
            file_data,
            mimetype='video/mp4',
            headers={"Content-disposition": f"attachment; filename={filename}"}
        )

@app.route('/api/mistral', methods=['POST'])
def mistral_proxy():
    data = request.json
    api_key = os.environ.get('MISTRAL_API_KEY')
    if not api_key:
        return jsonify({'error': 'Mistral API Key não configurada no servidor'}), 500
    
    try:
        response = requests.post(
            'https://api.mistral.ai/v1/chat/completions',
            headers={
                'Content-Type': 'application/json',
                'Authorization': f'Bearer {api_key}'
            },
            json=data,
            timeout=60
        )
        response.raise_for_status()
        return jsonify(response.json())
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/openai-image', methods=['POST'])
def openai_image_proxy():
    data = request.json
    api_key = os.environ.get('OPENAI_API_KEY')
    if not api_key:
        return jsonify({'error': 'OpenAI API Key não configurada no servidor'}), 500
    
    try:
        # OpenAI DALL-E 3 only accepts: 1024x1024, 1792x1024, or 1024x1792
        response = requests.post(
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
            timeout=120
        )
        
        if response.status_code != 200:
            try:
                error_body = response.json()
                msg = error_body.get('error', {}).get('message', 'Erro na OpenAI')
                return jsonify({'error': msg}), response.status_code
            except:
                return jsonify({'error': f'Erro na OpenAI: {response.status_code}'}), response.status_code
        
        return jsonify(response.json())
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/proxy-image', methods=['GET'])
def proxy_image():
    url = request.args.get('url')
    if not url:
        return 'URL não fornecida', 400
    
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
    
    try:
        # Timeout curto — só verifica se a imagem está pronta
        response = requests.get(url, timeout=25, headers=headers)
        if response.status_code == 200 and len(response.content) > 1000:
            return Response(
                response.content,
                mimetype=response.headers.get('Content-Type', 'image/jpeg'),
                headers={"Cache-Control": "public, max-age=3600", "Access-Control-Allow-Origin": "*"}
            )
        return jsonify({'error': 'not_ready'}), 202  # Still generating
    except requests.Timeout:
        return jsonify({'error': 'not_ready'}), 202
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=3000)
#   T i k T o k   v 4   F i n a l   P r o d u c t i o n   S y n c  
 