import sqlite3
import os

DB_PATHS = [
    "app/star_temple.db",
    "dist/subramanya_temple_app/star_temple.db"
]

# Legacy Data from schema.sql
LEGACY_SEVAS = [
    ('Kunkuma Archane', 'ಕುಂಕುಮ ಅರ್ಚನೆ', 20.00),
    ('Panchambruta Abhisheka', 'ಪಂಚಾಮೃತ ಅಭಿಷೇಕ', 100.00),
    ('Ksheera Abhisheka', 'ಕ್ಷೀರ ಅಭಿಷೇಕ', 150.00),  # Price/Spelling update logic
    ('Rudra Abhisheka', 'ರುದ್ರ ಅಭಿಷೇಕ', 250.00),    # Price/Spelling update logic
    ('Anna Dhana Nidhi', 'ಅನ್ನ ದಾನ ನಿಧಿ', 0.00),
    ('General', 'ಸಾಮಾನ್ಯ', 0.00),
    ('Rajata Ashtottara Seva', 'ರಜತ ಅಷ್ಟೋತ್ತರ ಸೇವೆ', 500.00)
]

# Sevas to Remove (Modern/Incorrect ones)
REMOVE_LIST = [
    "Archana", 
    "Panchamrutha Abhisheka", 
    "General Donation"
]

def restore_schema():
    for db_path in DB_PATHS:
        if not os.path.exists(db_path):
            print(f"Skipping {db_path} (Not found)")
            continue
            
        print(f"Restoring {db_path}...")
        try:
            conn = sqlite3.connect(db_path)
            cursor = conn.cursor()
            
            # 1. Remove modern variants
            placeholders = ', '.join(['?'] * len(REMOVE_LIST))
            cursor.execute(f"DELETE FROM seva_catalog WHERE name_eng IN ({placeholders})", REMOVE_LIST)
            print(f"Removed {cursor.rowcount} modern entries.")
            
            # 2. Insert/Update Legacy Sevas
            for seva in LEGACY_SEVAS:
                name_eng, name_kan, price = seva
                try:
                    # Try INSERT
                    cursor.execute("""
                        INSERT INTO seva_catalog (name_eng, name_kan, price, is_active, is_slot_based)
                        VALUES (?, ?, ?, 1, 0)
                    """, (name_eng, name_kan, price))
                    print(f"Inserted: {name_eng}")
                except sqlite3.IntegrityError:
                    # If exists, UPDATE price and kan name
                    cursor.execute("""
                        UPDATE seva_catalog 
                        SET name_kan = ?, price = ?
                        WHERE name_eng = ?
                    """, (name_kan, price, name_eng))
                    print(f"Updated: {name_eng}")

            conn.commit()
            conn.close()
            print("Done.")
            
        except Exception as e:
            print(f"Error: {e}")

if __name__ == "__main__":
    restore_schema()
