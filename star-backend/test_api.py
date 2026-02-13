import requests

try:
    response = requests.get("http://127.0.0.1:8000/sevas")
    print(f"Status Code: {response.status_code}")
    print("Response JSON:")
    print(response.json())
except Exception as e:
    print(f"Error: {e}")
