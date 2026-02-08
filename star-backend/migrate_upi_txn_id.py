"""
Migration: Add UPI Transaction ID column to transactions table
"""
import psycopg2
from psycopg2 import sql

# Database connection config (same as main app)
DB_CONFIG = {
    "host": "localhost",
    "database": "star_temple_db",
    "user": "postgres",
    "password": "swaroop"
}

def migrate():
    """Add upi_transaction_id column to transactions table"""
    conn = psycopg2.connect(**DB_CONFIG)
    cursor = conn.cursor()
    
    try:
        # Check if column already exists
        cursor.execute("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'transactions' 
            AND column_name = 'upi_transaction_id'
        """)
        
        if cursor.fetchone():
            print("✓ Column 'upi_transaction_id' already exists. Skipping.")
            return
        
        # Add the column
        cursor.execute("""
            ALTER TABLE transactions 
            ADD COLUMN upi_transaction_id VARCHAR(50)
        """)
        
        # Add comment
        cursor.execute("""
            COMMENT ON COLUMN transactions.upi_transaction_id 
            IS 'UPI Transaction Reference ID (required when payment_mode is UPI)'
        """)
        
        conn.commit()
        print("✓ Added 'upi_transaction_id' column to transactions table")
        
    except Exception as e:
        conn.rollback()
        print(f"✗ Migration failed: {e}")
        raise
    finally:
        cursor.close()
        conn.close()

if __name__ == "__main__":
    migrate()
