
import sys
import os
from sqlalchemy import text

# Add current directory to path
sys.path.append(os.getcwd())

from database import SessionLocal

def check_sevas():
    db = SessionLocal()
    try:
        result = db.execute(text("SELECT id, name_eng, price, is_shaswata FROM seva_catalog")).fetchall()
        print("SEVA CATALOG:")
        for row in result:
            print(f"ID: {row[0]} | Name: {row[1]} | Price: {row[2]} | Shaswata: {row[3]}")
    finally:
        db.close()

if __name__ == "__main__":
    check_sevas()
