"""Check devotees table columns"""
from database import engine
from sqlalchemy import text

with engine.connect() as conn:
    result = conn.execute(text("""
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'devotees'
        ORDER BY ordinal_position
    """))
    print("Columns in 'devotees' table:")
    for row in result:
        print(f"  - {row[0]}")
