import requests
import json
import random
import string
from datetime import datetime

BASE_URL = "http://127.0.0.1:8000"

def generate_random_phone():
    return "".join(random.choices(string.digits, k=10))

def generate_random_name():
    return "TestUser_" + "".join(random.choices(string.ascii_letters, k=5))

def test_booking(seva_id, seva_name, amount=100.0, is_new_devotee=True):
    print(f"\n--- Testing Booking: {seva_name} (ID: {seva_id}) ---")
    
    phone = generate_random_phone() if is_new_devotee else "9988776655"
    name = generate_random_name() if is_new_devotee else "Existing User"
    
    payload = {
        "devotee_name": name,
        "phone_number": phone,
        "gothra": "Kashyapa",
        "nakshatra": "Ashwini",
        "rashi": "Mesha",
        "seva_id": seva_id,
        "payment_mode": "CASH",
        "amount": amount,
        "notes": f"Test {seva_name} Booking",
        "seva_date": datetime.now().strftime("%Y-%m-%d")
    }
    
    # Optional: General Donation might check for empty fields
    if seva_id == 8: # Assuming 8 is General
        payload["notes"] = "General Donation Test"

    print(f"Payload: {json.dumps(payload, indent=2)}")
    
    try:
        response = requests.post(f"{BASE_URL}/book-seva", json=payload)
        print(f"Status: {response.status_code}")
        print(f"Response: {response.text}")
        
        if response.status_code == 200:
            print("[SUCCESS]")
        else:
            print("[FAILED]")
    except Exception as e:
        print(f"[ERROR] {e}")

def list_sevas():
    try:
        # Assuming there is a generic endpoint or we check DB. 
        # Since I deleted check_sevas, I'll valid blind or use common IDs.
        # 1=Archana, 2=.., 8=General (from memory)
        pass
    except:
        pass

if __name__ == "__main__":
    # Test 1: General Donation (ID 8) - New Devotee
    test_booking(8, "General Donation", amount=501.0, is_new_devotee=True)
    
    # Test 2: Archana (ID 5?) - New Devotee (Common Seva)
    test_booking(5, "Kunkuma Archane", amount=20.0, is_new_devotee=True)
    
    # Test 3: General Donation - Existing Devotee
    test_booking(8, "General Donation (Existing)", amount=101.0, is_new_devotee=False)
