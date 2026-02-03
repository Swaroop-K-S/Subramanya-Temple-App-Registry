import random
from locust import HttpUser, task, between

class StarUser(HttpUser):
    wait_time = between(1, 3)

    @task(3)
    def view_daily_sankalpa(self):
        self.client.get("/daily-sankalpa")

    @task(1)
    def book_seva(self):
        payload = {
            "devotee_name": "Stress Test Bot",
            "phone_number": "9000000000",
            "gothra": "Kashyapa",
            "nakshatra": "Ashwini",
            "seva_id": 1,
            "amount": 10.0,
            "payment_mode": "CASH"
        }
        self.client.post("/book-seva", json=payload)
