import sqlite3
import os

DB_PATH = os.path.join("app", "star_temple.db")

def list_sevas():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    print("\n=== Seva Catalog ===")
    print(f"{'ID':<5} {'Name (Eng)':<30} {'Price'}")
    print("-" * 50)
    
    try:
        cursor.execute("SELECT id, name_eng, price FROM seva_catalog")
        sevas = cursor.fetchall()
        for seva in sevas:
            print(f"{seva[0]:<5} {seva[1]:<30} ₹{seva[2]}")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    list_sevas()
