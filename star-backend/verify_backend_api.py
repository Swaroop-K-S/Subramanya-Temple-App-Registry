import requests
import sys

BASE_URL = "http://127.0.0.1:8000"

def verify_api():
    session = requests.Session()
    
    # 1. Login
    print(f"Logging in to {BASE_URL}...")
    try:
        login_data = {"username": "admin_test", "password": "admin123"}
        response = session.post(f"{BASE_URL}/token", json=login_data)
        if response.status_code != 200:
            print(f"Login failed: {response.status_code} {response.text}")
            return False
        token = response.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        print("Login successful.")
    except Exception as e:
        print(f"Connection failed: {e}")
        return False

    # 2. Add Seva
    print("Creating new Seva...")
    new_seva = {
        "name_eng": "API Test Seva",
        "name_kan": "API Test Seva KN",
        "price": 501.0,
        "is_active": True,
        "description": "Created via API verification script",
        "is_shaswata": False,
        "is_slot_based": False
    }
    
    response = session.post(f"{BASE_URL}/sevas", json=new_seva, headers=headers)
    if response.status_code == 500 and "UNIQUE constraint failed" in response.text:
        print("Seva likely already exists. Proceeding to verification.")
    elif response.status_code not in [200, 201]:
         print(f"Create Seva failed: {response.status_code} {response.text}")
         # Proceed to verify via GET anyway
    else:
        created_seva = response.json()
        print(f"Seva created: {created_seva['id']} - {created_seva['name_eng']}")

    # 3. List Sevas
    print("Listing Sevas...")
    response = session.get(f"{BASE_URL}/sevas", headers=headers)
    if response.status_code != 200:
        print(f"List Sevas failed: {response.status_code} {response.text}")
        return False
    
    sevas = response.json()
    found = False
    for seva in sevas:
        if seva["name_eng"] == "API Test Seva":
            found = True
            print(f"Found created Seva in list: {seva['id']}")
            break
            
    if found:
        print("VERIFICATION SUCCESSFUL")
        return True
    else:
        print("VERIFICATION FAILED: Created Seva not found in list")
        return False

if __name__ == "__main__":
    if verify_api():
        sys.exit(0)
    else:
        sys.exit(1)
