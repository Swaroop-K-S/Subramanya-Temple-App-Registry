
import sys
import os
from sqlalchemy import text

# Add current directory to path
sys.path.append(os.getcwd())

from database import SessionLocal

def fix_schema():
    db = SessionLocal()
    try:
        print("Attempting to add missing 'seva_type' column...")
        
        # Check if column exists first to avoid aggressive erroring (though IF NOT EXISTS handles it in postgres usually)
        # But let's just run ALTER TABLE with IF NOT EXISTS logic handled by SQL or generic check
        
        # PostgreSQL specific syntax
        query = text("ALTER TABLE shaswata_subscriptions ADD COLUMN IF NOT EXISTS seva_type VARCHAR(20) DEFAULT 'GENERAL';")
        
        db.execute(query)
        db.commit()
        print("Schema Update Successful: 'seva_type' added.")
        
    except Exception as e:
        print(f"Schema Update Failed: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    fix_schema()
