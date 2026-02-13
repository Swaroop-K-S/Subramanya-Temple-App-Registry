import requests
import json

BASE_URL = "http://127.0.0.1:8000"

def test_shaswata_booking():
    endpoint = f"{BASE_URL}/shaswata/subscribe"
    
    payload = {
        "devotee_name": "Shaswata Tester",
        "phone_number": "8877665544",
        "gothra": "Vashishta",
        "nakshatra": "Bharani",
        "rashi": "Mesha",
        "address": "123 Temple Road",
        "area": "Malgudi",
        "pincode": "577001",
        "seva_id": 9, 
        "amount": 5000.0,
        "payment_mode": "CASH",
        "subscription_type": "LUNAR",
        "maasa": "Chaitra",
        "paksha": "Shukla",
        "tithi": "Purnima",
        "notes": "Test Shaswata Booking"
    }
    
    print(f"Testing Shaswata Subscription")
    print(f"Sending payload: {json.dumps(payload, indent=2)}")
    
    try:
        response = requests.post(endpoint, json=payload)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        
        if response.status_code == 200:
            print("[SUCCESS] Shaswata Subscription Successful!")
        else:
            print("[FAILED] Shaswata Subscription Failed.")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_shaswata_booking()
