import requests

url = "https://cvrdcupvqvkpwllwlkfw.supabase.co/rest/v1/"
# Service Role Key fetched from Management API
key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2cmRjdXB2cXZrcHdsbHdsa2Z3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcxMjYzNDQ1NiwiZXhwIjoyMDM4NDAwNDU2fQ.6N7wGCKwiRWwZkFoBNSF9c7pWHrnnUgA"

headers = {
    "apikey": key,
    "Authorization": f"Bearer {key}",
    "Content-Type": "application/json",
    "Prefer": "return=representation"
}

def get_pro_emails():
    # Fetch active PRO/TURBO licenses
    params = {
        "select": "email,plano",
        "status": "eq.ativa"
    }
    res = requests.get(f"{url}licencas", headers=headers, params=params)
    if res.status_code != 200:
        print(f"Error fetching licenses: {res.text}")
        return []
    
    data = res.json()
    pro_license_emails = [item['email'] for item in data if 'pro' in item['plano'].lower() or 'turbo' in item['plano'].lower()]
    return list(set(pro_license_emails))

def sync():
    emails = get_pro_emails()
    print(f"Found {len(emails)} active PRO/TURBO emails.")
    
    for email in emails:
        # Update profiles table
        # We assume email identifies the profile OR we link via portal_users if necessary
        # However, many Supabase schemas have email in profiles
        try:
            update_data = {"tier": "PRO"}
            # Try updating by email in profiles
            res_p = requests.patch(f"{url}profiles?email=eq.{email}", headers=headers, json=update_data)
            
            # Also try umbra_z_profiles to be safe
            res_z = requests.patch(f"{url}umbra_z_profiles?email=eq.{email}", headers=headers, json=update_data)
            
            print(f"Syncing {email}: Profiles: {res_p.status_code}, Umbra_Z: {res_z.status_code}")
        except Exception as e:
            print(f"Failed to sync {email}: {str(e)}")

if __name__ == "__main__":
    sync()
