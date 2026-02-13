import sqlite3
import os

DB_PATHS = [
    "app/star_temple.db",
    "dist/subramanya_temple_app/star_temple.db"
]

def fix_nulls():
    for db_path in DB_PATHS:
        if not os.path.exists(db_path):
            continue
            
        print(f"Fixing NULLs in {db_path}...")
        try:
            conn = sqlite3.connect(db_path)
            cursor = conn.cursor()
            
            # Fix is_shaswata
            cursor.execute("UPDATE seva_catalog SET is_shaswata = 0 WHERE is_shaswata IS NULL")
            rows = cursor.rowcount
            print(f"Updated {rows} rows (is_shaswata).")
            
            # Fix is_slot_based (just in case)
            cursor.execute("UPDATE seva_catalog SET is_slot_based = 0 WHERE is_slot_based IS NULL")
            
            # Fix is_active
            cursor.execute("UPDATE seva_catalog SET is_active = 1 WHERE is_active IS NULL")

            conn.commit()
            conn.close()
            print("Done.")
            
        except Exception as e:
            print(f"Error: {e}")

if __name__ == "__main__":
    fix_nulls()
