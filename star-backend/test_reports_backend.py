from database import SessionLocal
from crud import get_financial_report
import json

def test_report():
    db = SessionLocal()
    try:
        from sqlalchemy import text
        first_tx = db.execute(text("SELECT MIN(transaction_date) FROM transactions")).scalar()
        print(f"First Tx: {first_tx}")
        
        if first_tx:
            report = get_financial_report(db, str(first_tx.date()), "2030-12-31")
            print(json.dumps(report, indent=2, default=str))
        else:
            print("No transactions found.")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    test_report()
