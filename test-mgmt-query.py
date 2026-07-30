import requests
import os

# Supabase Management API Token
token = os.environ["SUPABASE_ACCESS_TOKEN"]
project_ref = "cvrdcupvqvkpwllwlkfw"

# The endpoint for querying via Management API is /v1/projects/{ref}/query
url = f"https://api.supabase.com/v1/projects/{project_ref}/query"

headers = {
    "Authorization": f"Bearer {token}",
    "Content-Type": "application/json"
}

query = """
SELECT email, plano 
FROM licencas 
WHERE status = 'ativa' 
AND (plano ILIKE '%pro%' OR plano ILIKE '%turbo%')
"""

def fetch():
    res = requests.post(url, headers=headers, json={"query": query})
    if res.status_code != 201 and res.status_code != 200:
        print(f"Error: {res.status_code} - {res.text}")
        return
    
    print("Success!")
    print(res.json())

if __name__ == "__main__":
    fetch()
