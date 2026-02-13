import sqlite3
import os

# Target the PROD database directly
DB_PATH = "dist/subramanya_temple_app/star_temple.db"

def add_general_donation():
    if not os.path.exists(DB_PATH):
        print(f"Error: Database not found at {DB_PATH}")
        return

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    try:
        # Check if it already exists
        cursor.execute("SELECT id FROM seva_catalog WHERE name_eng LIKE '%General%'")
        exists = cursor.fetchone()
        
        if exists:
            print(f"General Donation already exists (ID: {exists[0]}).")
        else:
            print("Adding General Donation...")
            cursor.execute("""
                INSERT INTO seva_catalog (name_eng, name_kan, description_eng, description_kan, price, is_active, is_slot_based)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            """, ("General Donation", "ಸಾಮಾನ್ಯ ಕಾಣಿಕೆ", "Open contribution to the temple", "ದೇವಸ್ಥಾನಕ್ಕೆ ಮುಕ್ತ ಕಾಣಿಕೆ", 0.0, 1, 0))
            conn.commit()
            print("Successfully added General Donation.")
            
    except Exception as e:
        print(f"Error: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    add_general_donation()
