from flask import Flask, request, jsonify, Response
from flask_cors import CORS
import subprocess, json, requests

app = Flask(__name__)
CORS(app)

@app.route('/api/pinterest', methods=['POST'])
def pinterest():
    url = request.json.get('url')
    if not url:
        return jsonify({'error': 'URL não fornecida'}), 400

    result = subprocess.run(
        ['yt-dlp', '--dump-json', '--no-playlist', url],
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

@app.route('/api/pinterest', methods=['GET'])
def download():
    url = request.args.get('download')
    filename = request.args.get('filename', 'pinterest.mp4')
    if not url:
        return 'URL não fornecida', 400

    r = requests.get(url, stream=True, headers={'Referer': 'https://www.pinterest.com/'})
    headers = {
        'Content-Disposition': f'attachment; filename="{filename}"',
        'Content-Type': r.headers.get('Content-Type', 'video/mp4')
    }
    return Response(r.iter_content(chunk_size=8192), headers=headers)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=3000)
