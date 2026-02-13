import requests
import json
import random
import string
from datetime import datetime

BASE_URL = "http://127.0.0.1:8000"

def generate_random_phone():
    return "".join(random.choices(string.digits, k=10))

def test_stress():
    print("--- Stress Testing Booking ---")
    
    # Test 1: Kannada Name
    payload1 = {
        "devotee_name": "Ramesh Kumar",
        "devotee_name_kn": "ರಮೇಶ್ ಕುಮಾರ್",
        "phone_number": generate_random_phone(),
        "gothra": "Kashyapa",
        "seva_id": 8, # General
        "amount": 101.0,
        "payment_mode": "CASH",
        "notes": "Kannada Name Test"
    }
    send_request(payload1, "Kannada Name")

    # Test 2: Long Notes
    payload2 = {
        "devotee_name": "Long Notes User",
        "phone_number": generate_random_phone(),
        "seva_id": 8,
        "amount": 50.0,
        "payment_mode": "CASH",
        "notes": "A" * 500 # Max length
    }
    send_request(payload2, "Long Notes")

    # Test 3: Missing Optional Fields
    payload3 = {
        "devotee_name": "Minimal User",
        "phone_number": generate_random_phone(),
        "seva_id": 8,
        "amount": 10.0,
        "payment_mode": "CASH"
    }
    send_request(payload3, "Minimal Payload")

    # Test 4: SQL Injection Attempt in Name
    payload4 = {
        "devotee_name": "Robert'); DROP TABLE devotees; --",
        "phone_number": generate_random_phone(),
        "seva_id": 8,
        "amount": 666.0,
        "payment_mode": "CASH"
    }
    send_request(payload4, "SQL Injection Name")

    # Test 5: Shashwata Booking (LUNAR) - WITH CORRECT SCHEMA
    payload5 = {
        "devotee_name": "Shaswata Stress User",
        "phone_number": generate_random_phone(),
        "seva_id": 9, # Rajata Ashtottara
        "amount": 5000.0,
        "payment_mode": "CASH",
        "subscription_type": "LUNAR",
        "seva_type": "GENERAL",
        "maasa": "Chaitra",
        "paksha": "Shukla",
        "tithi": 5,
        "notes": "Stress Test Shashwata"
    }
    send_request_shaswata(payload5, "Shaswata Booking")

def send_request(payload, test_name):
    print(f"\nTesting: {test_name}")
    try:
        r = requests.post(f"{BASE_URL}/book-seva", json=payload)
        print(f"Status: {r.status_code}")
        if r.status_code != 200:
            print(f"Response: {r.text}")
        else:
            print("Success")
    except Exception as e:
        print(f"Error: {e}")

def send_request_shaswata(payload, test_name):
    print(f"\nTesting: {test_name}")
    try:
        r = requests.post(f"{BASE_URL}/shaswata/subscribe", json=payload)
        print(f"Status: {r.status_code}")
        if r.status_code != 200:
            print(f"Response: {r.text}")
        else:
            print("Success")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_stress()
