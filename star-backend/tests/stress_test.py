import time
import requests
import concurrent.futures
import random
import sys

# Configuration
CONCURRENT_USERS = 500
DURATION_SECONDS = 60
BASE_URL = "http://127.0.0.1:8000"

endpoints = [
    ("/daily-sankalpa", "GET", None),
    ("/book-seva", "POST", {
        "devotee_name": "SRE Test User",
        "phone_number": "9999999999",
        "gothra": "TestGothra",
        "nakshatra": "Ashwini",
        "seva_id": 1,
        "amount": 10.0,
        "payment_mode": "CASH"
    })
]

success_count = 0
error_count = 0
latencies = []

def user_session():
    """Simulate a single user performing actions"""
    global success_count, error_count
    
    start_time = time.time()
    while time.time() - start_time < DURATION_SECONDS:
        # Pick an action
        endpoint, method, payload = random.choice(endpoints)
        url = f"{BASE_URL}{endpoint}"
        
        try:
            req_start = time.time()
            if method == "GET":
                resp = requests.get(url, timeout=5)
            else:
                resp = requests.post(url, json=payload, timeout=5)
            
            latency = time.time() - req_start
            latencies.append(latency)
            
            if resp.status_code in [200, 400]: # 400 is acceptable for biz logic errors during stress
                success_count += 1
            else:
                error_count += 1
                # print(f"Error {resp.status_code}: {resp.text}")
        except Exception as e:
            error_count += 1
            # print(f"Exception: {e}")
        
        # Think time
        time.sleep(random.uniform(0.1, 0.5))

def run_stress_test():
    print(f"Starting Level 10 Stress Test: {CONCURRENT_USERS} users, {DURATION_SECONDS}s duration")
    print(f"Target: {BASE_URL}")
    
    start_test = time.time()
    
    with concurrent.futures.ThreadPoolExecutor(max_workers=CONCURRENT_USERS) as executor:
        futures = [executor.submit(user_session) for _ in range(CONCURRENT_USERS)]
        concurrent.futures.wait(futures)
        
    total_time = time.time() - start_test
    total_requests = success_count + error_count
    qps = total_requests / total_time
    avg_latency = sum(latencies) / len(latencies) if latencies else 0
    
    print("\n=== STRESS TEST RESULTS ===")
    print(f"Total Requests: {total_requests}")
    print(f"Successful: {success_count}")
    print(f"Failed: {error_count}")
    print(f"Duration: {total_time:.2f}s")
    print(f"Max QPS: {qps:.2f}")
    print(f"Avg Latency: {avg_latency*1000:.2f}ms")
    
    if avg_latency > 0.5:
        print("\nBOTTLENECK DETECTED: Latency > 500ms")
        print("Suspect: crud.py -> get_daily_transactions (Full Table Scans) or Panchang calculations.")
    else:
        print("\nSystem Health: OPTIMAL")

if __name__ == "__main__":
    run_stress_test()
