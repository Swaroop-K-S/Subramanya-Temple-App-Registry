from app.database import SessionLocal
from sqlalchemy import text

def inspect():
    db = SessionLocal()
    try:
        print("\nColumns:")
        result = db.execute(text("PRAGMA table_info(transactions)")).fetchall()
        for col in result:
            print(col)
            
        print("\nTriggers:")
        triggers = db.execute(text("SELECT name, sql FROM sqlite_master WHERE type='trigger' AND tbl_name='transactions'")).fetchall()
        for t in triggers:
            print(f"Trigger: {t[0]}")
            print(t[1])
            
    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    inspect()
