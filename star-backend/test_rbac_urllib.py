import urllib.request
import urllib.parse
import json

BASE_URL = "http://localhost:8000"

def test_login(username, password, expected_role):
    print(f"Testing {username}...")
    try:
        # Login
        data = json.dumps({"username": username, "password": password}).encode("utf-8")
        req = urllib.request.Request(f"{BASE_URL}/token", data=data, method="POST", headers={"Content-Type": "application/json"})
        with urllib.request.urlopen(req) as response:
            if response.status != 200:
                print(f"Login failed: {response.status}")
                return
            token_data = json.loads(response.read().decode())
            token = token_data["access_token"]
            
        # Get Me
        req = urllib.request.Request(f"{BASE_URL}/users/me", headers={"Authorization": f"Bearer {token}"})
        with urllib.request.urlopen(req) as response:
            if response.status != 200:
                print(f"Get Me failed: {response.status}")
                return
            user_data = json.loads(response.read().decode())
            print(f"User: {user_data['username']}, Role: {user_data['role']}")
            
            if user_data['role'] == expected_role:
                print("✅ Role Match")
            else:
                print(f"❌ Role Mismatch (Expected {expected_role})")
                
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_login("admin", "password123", "admin")
    print("-" * 20)
    test_login("clerk", "clerk123", "clerk")
