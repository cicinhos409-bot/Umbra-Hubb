from flask import Flask, request, jsonify, Response, send_file
from flask_cors import CORS
import subprocess, json, requests, tempfile, os

app = Flask(__name__)
CORS(app)

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

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=3000)
