import requests
import json

BASE_URL = "http://127.0.0.1:8000"

def test_booking():
    # 1. Get Seva ID for "General"
    try:
        r = requests.get(f"{BASE_URL}/sevas")
        sevas = r.json()
        general_seva = next((s for s in sevas if "General" in s['name_eng']), None)
        
        if not general_seva:
            print("General Seva not found!")
            return

        print(f"Testing Booking for: {general_seva['name_eng']} (ID: {general_seva['id']})")
        
        # 2. Payload
        payload = {
            "devotee_name": "Swaroop",
            "phone_number": "7975811522",
            "gothra": "Sandilya",
            "nakshatra": "Pushya",
            "rashi": "Karka",
            "seva_id": general_seva['id'],
            "payment_mode": "CASH",
            "amount": 1100.0,
            "notes": "Test Booking"
        }
        
        # 3. Post (Correct Endpoint: /book-seva)
        print(f"Sending payload: {json.dumps(payload, indent=2)}")
        r = requests.post(f"{BASE_URL}/book-seva", json=payload)
        
        print(f"Status Code: {r.status_code}")
        print(f"Response: {r.text}")
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_booking()
