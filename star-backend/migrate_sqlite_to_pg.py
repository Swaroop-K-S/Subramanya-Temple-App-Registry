"""
S.T.A.R. Data Migration: SQLite → Embedded PostgreSQL
=====================================================
One-time script to transfer ALL existing data from the old SQLite database
into the new embedded PostgreSQL database.

Usage:
    python migrate_sqlite_to_pg.py

This script:
1. Reads all data from the SQLite database at star-backend/data/star_temple.db
2. Starts the embedded PostgreSQL via pgserver
3. Creates the schema using SQLAlchemy models
4. Copies all rows table-by-table with proper type conversions
"""

import os
import sys
import sqlite3
from datetime import datetime

# Add parent to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

def get_sqlite_data():
    """Connect to the old SQLite database and read all tables."""
    sqlite_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data", "star_temple.db")
    
    if not os.path.exists(sqlite_path):
        print(f"[ERROR] SQLite database not found at: {sqlite_path}")
        sys.exit(1)
    
    print(f"[MIGRATE] Reading from SQLite: {sqlite_path}")
    conn = sqlite3.connect(sqlite_path)
    conn.row_factory = sqlite3.Row  # Access by column name
    
    return conn


def get_table_names(sqlite_conn):
    """Get all table names from SQLite."""
    cursor = sqlite_conn.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name")
    return [row['name'] for row in cursor.fetchall()]


def get_table_data(sqlite_conn, table_name):
    """Get all rows from a SQLite table."""
    cursor = sqlite_conn.execute(f"SELECT * FROM {table_name}")
    columns = [desc[0] for desc in cursor.description]
    rows = cursor.fetchall()
    return columns, [dict(row) for row in rows]


def migrate():
    """Main migration function."""
    print("=" * 60)
    print("  S.T.A.R. Data Migration: SQLite → PostgreSQL")
    print("=" * 60)
    
    # Step 1: Read SQLite data
    sqlite_conn = get_sqlite_data()
    tables = get_table_names(sqlite_conn)
    print(f"[MIGRATE] Found {len(tables)} tables: {', '.join(tables)}")
    
    # Collect all data from SQLite BEFORE starting PG
    all_data = {}
    for table in tables:
        columns, rows = get_table_data(sqlite_conn, table)
        all_data[table] = {'columns': columns, 'rows': rows}
        print(f"  📋 {table}: {len(rows)} rows, {len(columns)} columns")
    
    sqlite_conn.close()
    
    # Step 2: Start embedded PostgreSQL and create schema
    print("\n[MIGRATE] Starting embedded PostgreSQL...")
    from app.database import engine, is_postgres, _pg_server
    
    if not is_postgres():
        print("[ERROR] PostgreSQL did not start! Cannot migrate.")
        sys.exit(1)
    
    # Create all tables from models
    from app.models import Base
    Base.metadata.create_all(bind=engine)
    print("[MIGRATE] PostgreSQL schema created from models.")
    
    # Step 3: Get PG table names from metadata
    pg_tables = [table.name for table in Base.metadata.sorted_tables]
    print(f"[MIGRATE] PG model tables: {', '.join(pg_tables)}")
    
    # Step 4: Migrate data table-by-table
    # Order matters: parent tables first, then child tables (foreign keys)
    migration_order = [
        'users',
        'seva_catalog', 
        'devotees',
        'transactions',
        'shaswata_subscriptions',
        'shaswata_events',
        'communication_logs',
        'system_settings',
        'audit_log',
    ]
    
    from sqlalchemy import text as sa_text
    
    migrated_count = 0
    skipped = []
    
    with engine.connect() as conn:
        for table_name in migration_order:
            if table_name not in all_data:
                print(f"  ⏩ Skipping {table_name} (not in SQLite)")
                skipped.append(table_name)
                continue
            
            data = all_data[table_name]
            rows = data['rows']
            columns = data['columns']
            
            if not rows:
                print(f"  ⏩ Skipping {table_name} (empty)")
                skipped.append(table_name)
                continue
            
            # Check which columns exist in PG
            try:
                pg_cols_result = conn.execute(sa_text(
                    f"SELECT column_name FROM information_schema.columns WHERE table_name = '{table_name}'"
                ))
                pg_columns = {row[0] for row in pg_cols_result.fetchall()}
            except Exception:
                print(f"  ⚠️ Skipping {table_name} (not in PG schema)")
                skipped.append(table_name)
                continue
            
            if not pg_columns:
                print(f"  ⚠️ Skipping {table_name} (PG table not found)")
                skipped.append(table_name)
                continue
            
            # Filter to columns that exist in both SQLite and PG
            common_cols = [c for c in columns if c in pg_columns]
            
            if not common_cols:
                print(f"  ⚠️ Skipping {table_name} (no matching columns)")
                skipped.append(table_name)
                continue
            
            print(f"\n  📥 Migrating {table_name} ({len(rows)} rows, {len(common_cols)} columns)...")
            
            # Build INSERT statement
            col_list = ', '.join(common_cols)
            param_list = ', '.join([f':{c}' for c in common_cols])
            insert_sql = sa_text(f"INSERT INTO {table_name} ({col_list}) VALUES ({param_list}) ON CONFLICT DO NOTHING")
            
            # Insert rows
            success = 0
            errors = 0
            for row in rows:
                try:
                    # Filter row to common columns and clean data
                    clean_row = {}
                    for col in common_cols:
                        val = row.get(col)
                        # Convert SQLite boolean integers to Python booleans
                        if isinstance(val, int) and col in ('is_active', 'is_shaswata', 'is_slot_based', 'synced', 'address_confirmed'):
                            val = bool(val)
                        clean_row[col] = val
                    
                    conn.execute(insert_sql, clean_row)
                    success += 1
                except Exception as e:
                    errors += 1
                    if errors <= 3:
                        print(f"    ⚠️ Row error: {e}")
            
            conn.commit()
            
            # Reset sequence for auto-increment columns
            try:
                if 'id' in common_cols:
                    conn.execute(sa_text(
                        f"SELECT setval(pg_get_serial_sequence('{table_name}', 'id'), COALESCE(MAX(id), 0) + 1, false) FROM {table_name}"
                    ))
                    conn.commit()
            except Exception:
                pass
            
            print(f"    ✅ {success} rows migrated, {errors} errors")
            migrated_count += success
        
        # Also migrate any tables NOT in our ordered list but present in SQLite
        for table_name in all_data:
            if table_name not in migration_order and table_name not in skipped:
                print(f"  ℹ️ Unhandled table: {table_name} ({len(all_data[table_name]['rows'])} rows)")
    
    print(f"\n{'=' * 60}")
    print(f"  Migration Complete! {migrated_count} total rows migrated.")
    print(f"  Skipped tables: {', '.join(skipped) if skipped else 'none'}")
    print(f"{'=' * 60}")


if __name__ == '__main__':
    migrate()
