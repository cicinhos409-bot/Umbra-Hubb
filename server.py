from flask import Flask, request, jsonify, Response, send_file
from flask_cors import CORS
import subprocess, json, requests, tempfile, os, time

app = Flask(__name__)
# Enable CORS for the Vercel frontend
CORS(app, origins=["https://umbrahubb.vercel.app", "http://localhost:5173"])

import re
from datetime import datetime

@app.route('/api/tiktok_analytics')
def tiktok_analytics():
    username = request.args.get('u', '').replace('@', '').strip()
    if not username:
        return jsonify({'error': 'Parâmetro ?u= necessário'}), 400

    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://www.tikwm.com/',
        'Accept': 'application/json',
    }

    # 1. User info
    info_res = requests.get(
        f'https://www.tikwm.com/api/user/info?unique_id={username}',
        headers=headers, timeout=10
    )
    info_json = info_res.json()
    print(f'[INFO] code={info_json.get("code")} keys={list((info_json.get("data") or {}).keys())}')

    user_data = info_json.get('data', {})
    user = user_data.get('user', user_data)
    stats = user_data.get('stats', {})

    # 2. Posts — sem try/except pra ver o erro real
    posts_res = requests.get(
        f'https://www.tikwm.com/api/user/posts?unique_id={username}&count=20',
        headers=headers, timeout=12
    )
    print(f'[POSTS] status={posts_res.status_code} body={posts_res.text[:500]}')
    posts_json = posts_res.json()
    
    d = posts_json.get('data', [])
    raw_videos = []
    if isinstance(d, list): raw_videos = d
    elif isinstance(d, dict):
        raw_videos = d.get('videos') or d.get('aweme_list') or d.get('list') or d.get('data') or []
    
    print(f'[POSTS] found {len(raw_videos)} videos')

    return jsonify({
        'author': {'uniqueId': user.get('uniqueId', username), 'nickname': user.get('nickname', username)},
        'stats': stats,
        'videos_count': len(raw_videos),
        'raw_source': 'debug'
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
