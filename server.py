from flask import Flask, request, jsonify, Response, send_file
from flask_cors import CORS
import subprocess, json, requests, tempfile, os, time

app = Flask(__name__)
# Enable CORS for the Vercel frontend
CORS(app, origins=["https://umbrahubb.vercel.app", "http://localhost:5173"])

import re
from datetime import datetime

def parse_num(v):
    if isinstance(v, (int, float)): return v
    if not v: return 0
    s = str(v).upper().strip()
    try:
        if s.endswith('K'): return int(float(s[:-1]) * 1000)
        if s.endswith('M'): return int(float(s[:-1]) * 1000000)
        if s.endswith('B'): return int(float(s[:-1]) * 1000000000)
        return int(re.sub(r'[^0-9]', '', s))
    except: return 0

def extract_hashtags(videos):
    tags_map = {}
    for v in videos:
        matches = re.findall(r'#[a-zA-Z0-9_\u00C0-\u00FF]+', v.get('desc', ''))
        for tag in matches:
            clean = tag.replace('#', '').lower()
            tags_map[clean] = tags_map.get(clean, 0) + 1
    sorted_tags = sorted(tags_map.items(), key=lambda x: x[1], reverse=True)
    return [{"name": name, "count": count} for name, count in sorted_tags[:15]]

def extract_mentions(videos):
    mentions_map = {}
    for v in videos:
        matches = re.findall(r'@[a-zA-Z0-9._]+', v.get('desc', ''))
        for m in matches:
            clean = m.replace('@', '').lower()
            if len(clean) > 1:
                mentions_map[clean] = mentions_map.get(clean, 0) + 1
    sorted_mentions = sorted(mentions_map.items(), key=lambda x: x[1], reverse=True)
    return [{"name": name, "count": count} for name, count in sorted_mentions[:10]]

def calculate_earnings(followers, eng_rate):
    base_rate = 0.002
    eng_multiplier = max(0.1, eng_rate / 5.0)
    low = followers * base_rate * eng_multiplier * 0.7
    high = followers * base_rate * eng_multiplier * 1.3
    return {"min": int(low), "max": int(high)}

@app.route('/api/tiktok_analytics', methods=['GET'])
def tiktok_analytics():
    username = request.args.get('u', '').replace('@', '')
    if not username:
        return jsonify({"error": "Username is required"}), 400
    
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Referer': 'https://www.tikwm.com/'
    }

    try:
        # 1. Get User Info
        user_res = requests.get(f"https://www.tikwm.com/api/user/info?unique_id={username}", headers=headers, timeout=12)
        user_json = user_res.json()
        if user_json.get('code') != 0 or not user_json.get('data'):
            return jsonify({"error": "User not found or API error"}), 404
        
        user_data = user_json.get('data', {})
        user = user_data.get('user', {})
        stats = user_data.get('stats', {})
        
        follower_count = parse_num(stats.get('followerCount', stats.get('follower_count', stats.get('fans', user.get('followerCount', 0)))))
        following_count = parse_num(stats.get('followingCount', stats.get('following_count', stats.get('following', user.get('followingCount', 0)))))
        heart_count = parse_num(stats.get('heartCount', stats.get('heart_count', stats.get('heart', stats.get('diggCount', user.get('heartCount', 0))))))
        video_count = parse_num(stats.get('videoCount', stats.get('video_count', stats.get('video', user.get('videoCount', 0)))))

        # 2. Get Posts (Alternative API)
        posts_url = f"https://www.tikwm.com/api/?url=https://www.tiktok.com/@{username}&count=20"
        posts_res = requests.get(posts_url, headers=headers, timeout=15)
        print(f"[DEBUG posts] url={posts_url} status={posts_res.status_code} body={posts_res.text[:300]}")
        posts_json = posts_res.json()
        
        raw_videos = []
        d = posts_json.get('data')
        if isinstance(d, list): raw_videos = d
        elif d and isinstance(d.get('videos'), list): raw_videos = d['videos']
        elif d and isinstance(d.get('data'), list): raw_videos = d['data']
        elif d and isinstance(d.get('list'), list): raw_videos = d['list']
        elif d and isinstance(d.get('aweme_list'), list): raw_videos = d['aweme_list']
        elif d and isinstance(d.get('itemList'), list): raw_videos = d['itemList']
        
        videos_list = []
        for v in raw_videos:
            v_stats = v.get('stats', {})
            plays = parse_num(v.get('play_count', v.get('playCount', v_stats.get('playCount', 0))))
            likes = parse_num(v.get('digg_count', v.get('diggCount', v_stats.get('diggCount', 0))))
            comments = parse_num(v.get('comment_count', v.get('commentCount', v_stats.get('commentCount', 0))))
            shares = parse_num(v.get('share_count', v.get('shareCount', v_stats.get('shareCount', 0))))
            
            e_rate = (((likes + comments + shares) / follower_count) * 100) if follower_count > 0 else 0
            
            videos_list.append({
                "id": str(v.get('video_id', v.get('id'))),
                "desc": v.get('title', v.get('desc', '')),
                "plays": plays,
                "likes": likes,
                "comments": comments,
                "shares": shares,
                "create_date": v.get('create_time', v.get('createTime', 0)),
                "engRate": round(e_rate, 3)
            })
            
        analytics = None
        if videos_list:
            total_plays = sum(v['plays'] for v in videos_list)
            num_v = len(videos_list)
            total_likes = sum(v['likes'] for v in videos_list)
            total_comments = sum(v['comments'] for v in videos_list)
            total_shares = sum(v['shares'] for v in videos_list)
            avg_eng = (((total_likes + total_comments + total_shares) / (num_v * follower_count)) * 100) if follower_count > 0 else 0
            
            analytics = {
                "engagementRates": {
                    "total_rate": round(avg_eng, 2),
                    "likes_rate": round(((total_likes / num_v) / follower_count * 100) if follower_count > 0 else 0, 2),
                    "comments_rate": round(((total_comments / num_v) / follower_count * 100) if follower_count > 0 else 0, 2),
                    "shares_rate": round(((total_shares / num_v) / follower_count * 100) if follower_count > 0 else 0, 2),
                },
                "performance": {
                    "avgViews": int(total_plays / num_v),
                    "avgLikes": int(total_likes / num_v),
                    "avgComments": int(total_comments / num_v),
                    "avgShares": int(total_shares / num_v),
                },
                "dataset": [v['engRate'] for v in videos_list[:10]],
                "videos": videos_list,
                "hashtags": extract_hashtags(videos_list),
                "mentions": extract_mentions(videos_list),
                "earnings": calculate_earnings(follower_count, avg_eng)
            }
            
        return jsonify({
            "author": {
                "uniqueId": user.get('uniqueId', user.get('unique_id', username)),
                "nickname": user.get('nickname', user.get('uniqueId', username)),
                "avatarThumb": user.get('avatarThumb', user.get('avatar_thumb', user.get('avatarMedium', ''))),
                "signature": user.get('signature', user.get('bio', '')),
                "verified": bool(user.get('verified', user.get('is_verified', False)))
            },
            "stats": {
                "followerCount": follower_count,
                "followingCount": following_count,
                "heartCount": heart_count,
                "videoCount": video_count
            },
            "analytics": analytics,
            "raw_source": "tikwm_railway"
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

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
