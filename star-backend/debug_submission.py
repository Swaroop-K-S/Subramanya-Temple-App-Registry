
import sys
import os
from sqlalchemy import text

# Add current directory to path
sys.path.append(os.getcwd())

from database import SessionLocal
from crud import create_shaswata_subscription
from schemas import ShaswataCreate, SubscriptionType, PaymentMode

def test_submission():
    db = SessionLocal()
    try:
        print("Testing DB Connection...")
        # Check if address column exists
        try:
            db.execute(text("SELECT address FROM devotees LIMIT 1"))
            print("Address column exists.")
        except Exception as e:
            print(f"Address column MISSING: {e}")
            return

        print("Creating Payload...")
        # Mock Payload
        payload = ShaswataCreate(
            devotee_name="Debug User",
            phone_number="9999988888",
            gothra="Debug Gothra",
            address="Debug Address 123",
            subscription_type=SubscriptionType.GREGORIAN,
            event_day=15,
            event_month=3,
            seva_id=1,
            amount=101.0,
            payment_mode=PaymentMode.CASH,
            notes="Debug Test"
        )
        
        print("Invoking create_shaswata_subscription...")
        result = create_shaswata_subscription(db, payload)
        print("SUCCESS!")
        print(result)
        
    except Exception as e:
        print("FAILED WITH ERROR:")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    test_submission()
