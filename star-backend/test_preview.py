import requests
import json

url = "http://localhost:8000/print/preview"
payload = {
    "receipt_no": "TEST-1001",
    "date": "07-02-2026",
    "seva_name": "ಕುಂಕುಮ ಅರ್ಚನೆ",  # Kunkumarchana within Kannada
    "devotee_name": "Test User",
    "gothra": "Kashyapa",
    "nakshatra": "Ashwini",
    "rashi": "Mesha",
    "amount": "20.00",
    "payment_mode": "UPI",
    "lang": "KN"
}

try:
    print(f"Sending request to {url}...")
    response = requests.post(url, json=payload)
    
    if response.status_code == 200:
        print("Success! Image received.")
        with open("preview_test.jpg", "wb") as f:
            f.write(response.content)
    else:
        print(f"Error {response.status_code}:")
        print(response.text)

except Exception as e:
    print(f"Request failed: {e}")
