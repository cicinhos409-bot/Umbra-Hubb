import urllib.request, json

TOKEN = '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'

req = urllib.request.Request(
    'https://api.github.com/repos/cicinhos409-bot/Umbra-Hubb/deployments?per_page=10',
    headers={'Authorization': 'Bearer ' + TOKEN, 'Accept': 'application/vnd.github+json'}
)
with urllib.request.urlopen(req) as r:
    data = json.loads(r.read().decode())

print(f'Total deployments: {len(data)}')
print('='*70)
for d in data:
    env = d.get('environment', 'N/A')
    created = d.get('created_at', 'N/A')
    sha = d.get('sha', 'N/A')[:12]
    did = d.get('id', 'N/A')

    req2 = urllib.request.Request(
        f'https://api.github.com/repos/cicinhos409-bot/Umbra-Hubb/deployments/{did}/statuses',
        headers={'Authorization': 'Bearer ' + TOKEN, 'Accept': 'application/vnd.github+json'}
    )
    with urllib.request.urlopen(req2) as r2:
        statuses = json.loads(r2.read().decode())
    
    state = statuses[0].get('state') if statuses else 'sem status'
    url = statuses[0].get('target_url', 'N/A') if statuses else 'N/A'
    
    print(f'SHA: {sha}')
    print(f'Env: {env}')
    print(f'Created: {created}')
    print(f'Status: {state}')
    print(f'URL: {url}')
    print('-'*70)
