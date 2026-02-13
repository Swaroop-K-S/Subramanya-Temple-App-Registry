import requests
import json

BASE_URL = "http://127.0.0.1:8000"

def test_abhisheka_booking():
    endpoint = f"{BASE_URL}/book-seva"
    
    payload = {
        "devotee_name": "Abhisheka Tester",
        "phone_number": "9988776655",
        "gothra": "Kashyapa",
        "nakshatra": "Ashwini",
        "rashi": "Mesha",
        "seva_id": 4,  # Rudra Abhisheka
        "payment_mode": "CASH",
        "amount": 250.0,
        "notes": "Test Rudra Abhisheka"
    }
    
    print(f"Testing Booking for: Rudra Abhisheka (ID: 4)")
    print(f"Sending payload: {json.dumps(payload, indent=2)}")
    
    try:
        response = requests.post(endpoint, json=payload)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        
        if response.status_code == 200:
            print("[SUCCESS] Abhisheka Booking Successful!")
        else:
            print("[FAILED] Abhisheka Booking Failed.")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_abhisheka_booking()
