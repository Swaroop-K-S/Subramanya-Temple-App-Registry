import sqlite3
import traceback

def main():
    try:
        conn = sqlite3.connect('data/star_temple.db')
        c = conn.cursor()
        for t in ['transactions', 'shaswata_events', 'devotees', 'shaswata_subscriptions', 'seva_catalog', 'users']:
            try:
                c.execute(f"ALTER TABLE {t} ADD COLUMN is_active BOOLEAN DEFAULT 1;")
                print(f"Added is_active to {t}")
            except sqlite3.OperationalError as e:
                print(f"Skipped {t}: {e}")
        conn.commit()
    except Exception as e:
        traceback.print_exc()
    finally:
        if 'conn' in locals():
            conn.close()

if __name__ == '__main__':
    main()
