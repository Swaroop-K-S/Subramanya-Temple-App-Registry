"""
Migration Script: Add dispatch and feedback tracking columns
Run this once to update your existing database.
"""
from database import engine
from sqlalchemy import text

def run_migration():
    with engine.connect() as conn:
        # Add last_dispatch_date column
        conn.execute(text("""
            ALTER TABLE shaswata_subscriptions 
            ADD COLUMN IF NOT EXISTS last_dispatch_date DATE
        """))
        
        # Add last_feedback_date column
        conn.execute(text("""
            ALTER TABLE shaswata_subscriptions 
            ADD COLUMN IF NOT EXISTS last_feedback_date DATE
        """))
        
        conn.commit()
        print("✅ Migration complete! Columns added:")
        print("   - last_dispatch_date")
        print("   - last_feedback_date")

if __name__ == "__main__":
    run_migration()
