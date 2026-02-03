
import requests
import json
from datetime import datetime

# API URL
BASE_URL = "http://localhost:8000"

def test_financial_report():
    print(f"Testing Financial Report API...")
    
    # Define date range (Today)
    today = datetime.now().strftime("%Y-%m-%d")
    start_date = "2024-01-01" # Wide range to catch data
    end_date = "2026-12-31"
    
    url = f"{BASE_URL}/reports?start_date={start_date}&end_date={end_date}"
    
    try:
        response = requests.get(url)
        if response.status_code == 200:
            data = response.json()
            print("\n--- Financial Report ---")
            print(json.dumps(data, indent=2))
            
            # Basic validation
            financials = data.get("financials", {})
            total = financials.get("total", 0)
            cash = financials.get("cash", 0)
            upi = financials.get("upi", 0)
            
            if abs(total - (cash + upi)) < 0.01:
                print("\n✅ Total matches Cash + UPI")
            else:
                print(f"\n❌ Mismatch: Total={total}, Cash+UPI={cash+upi}")
                
        else:
            print(f"❌ Failed: {response.status_code} - {response.text}")
            
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    test_financial_report()
