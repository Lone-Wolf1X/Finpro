import json
import urllib.request
import urllib.error

BASE_URL = "http://localhost:8080/api"

def login():
    try:
        url = f"{BASE_URL}/auth/login"
        data = json.dumps({
            "email": "106",
            "password": "123456"
        }).encode('utf-8')
        
        req = urllib.request.Request(url, data=data, headers={
            'Content-Type': 'application/json'
        })
        
        with urllib.request.urlopen(req) as response:
            resp_data = json.loads(response.read().decode('utf-8'))
            print("Login Successful. Token obtained.")
            return resp_data["token"]
    except Exception as e:
        print(f"Login failed: {e}")
        return None

def mark_allotment(token, app_id):
    try:
        print(f"\nAttempting to mark allotment for Application ID: {app_id}")
        url = f"{BASE_URL}/ipo-applications/mark-allotment"
        data = json.dumps({
            "applicationId": app_id,
            "quantity": 10,
            "status": "ALLOTTED"
        }).encode('utf-8')

        req = urllib.request.Request(url, data=data, method="PUT", headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        })
        
        with urllib.request.urlopen(req) as response:
            print("Success!")
            print(json.dumps(json.loads(response.read().decode('utf-8')), indent=2))
            
    except urllib.error.HTTPError as e:
        print(f"Failed with status: {e.code}")
        print(f"Response: {e.read().decode('utf-8')}")
    except Exception as e:
        print(f"Request failed: {e}")

def main():
    token = login()
    if not token:
        return

    # Hardcoded application ID for testing - finding one first would be better but let's try 1
    # or list pending applications to find a valid ID
    try:
        url = f"{BASE_URL}/ipo-applications"
        req = urllib.request.Request(url, headers={"Authorization": f"Bearer {token}"})
        with urllib.request.urlopen(req) as response:
            apps = json.loads(response.read().decode('utf-8'))
            if apps:
                target_app = apps[0]
                print(f"Found application ID: {target_app['id']}, Status: {target_app['applicationStatus']}")
                mark_allotment(token, target_app['id'])
            else:
                print("No applications found.")
    except Exception as e:
        print(f"Failed to list apps: {e}")

if __name__ == "__main__":
    main()

