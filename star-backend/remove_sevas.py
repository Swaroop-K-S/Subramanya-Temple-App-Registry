import sqlite3
import os

DB_PATHS = [
    "app/star_temple.db",
    "dist/subramanya_temple_app/star_temple.db"
]

SEVAS_TO_REMOVE = [
    "Karthika Pooje",
    "Sarpa Samskara",
    "Ashlesha Bali",
    "Prasada Oota"
]

def remove_sevas():
    for db_path in DB_PATHS:
        if not os.path.exists(db_path):
            print(f"Skipping {db_path} (Not Found)")
            continue
            
        print(f"Cleaning {db_path}...")
        try:
            conn = sqlite3.connect(db_path)
            cursor = conn.cursor()
            
            placeholders = ', '.join(['?'] * len(SEVAS_TO_REMOVE))
            query = f"DELETE FROM seva_catalog WHERE name_eng IN ({placeholders})"
            cursor.execute(query, SEVAS_TO_REMOVE)
            
            rows = cursor.rowcount
            conn.commit()
            print(f"Deleted {rows} sevas from {db_path}.")
            conn.close()
        except Exception as e:
            print(f"Error deleting from {db_path}: {e}")

if __name__ == "__main__":
    remove_sevas()
