from database import engine
from sqlalchemy import text

def apply_migration():
    with engine.connect() as connection:
        print("Adding name_kan column...")
        try:
            connection.execute(text("ALTER TABLE seva_catalog ADD COLUMN IF NOT EXISTS name_kan TEXT DEFAULT NULL;"))
            connection.execute(text("UPDATE seva_catalog SET name_kan = name_eng WHERE name_kan IS NULL;"))
            connection.commit()
            print("Migration successful: name_kan column added and populated.")
        except Exception as e:
            print(f"Error applying migration: {e}")

if __name__ == "__main__":
    apply_migration()
