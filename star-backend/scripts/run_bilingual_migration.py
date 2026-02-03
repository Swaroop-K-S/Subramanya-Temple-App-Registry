"""
S.T.A.R. Backend - Run Bilingual Migration (Fixed)
===================================================
Execute each statement separately with commits.
"""

from database import engine
from sqlalchemy import text

def run_migration():
    """Apply the bilingual devotee fields migration."""
    
    statements = [
        ("Rename full_name to full_name_en", 
         "ALTER TABLE devotees RENAME COLUMN full_name TO full_name_en"),
        
        ("Add full_name_kn column", 
         "ALTER TABLE devotees ADD COLUMN full_name_kn TEXT"),
        
        ("Rename gothra to gothra_en", 
         "ALTER TABLE devotees RENAME COLUMN gothra TO gothra_en"),
        
        ("Add gothra_kn column", 
         "ALTER TABLE devotees ADD COLUMN gothra_kn TEXT"),
    ]
    
    with engine.connect() as conn:
        for desc, sql in statements:
            try:
                print(f"Running: {desc}...")
                conn.execute(text(sql))
                conn.commit()
                print(f"  ✅ Success")
            except Exception as e:
                print(f"  ⚠️ Skipped (may already exist): {e}")
                conn.rollback()
    
    print("\n✅ Migration completed!")

if __name__ == "__main__":
    run_migration()
