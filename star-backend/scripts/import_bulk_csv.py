"""
BULK MIGRATION SCRIPT: import_bulk_csv.py
Usage: python star-backend/import_bulk_csv.py

This script:
1. Finds the '2025' folder relative to this script's location.
2. Recursively searches for all .csv files.
3. filters out non-data files (like reports/issues).
4. Imports Devotees and Shaswata Subscriptions safely.
"""
import pandas as pd
import os
import glob
import re
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models import Devotee, ShaswataSubscription, SevaCatalog

# --- CONFIGURATION ---
# Dynamically find the 2025 folder (Go up one level from 'star-backend')
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "..", "2025")

# COLUMN MAPPING
# The script will look for these headers. It is case-insensitive.
COL_NAME = "Name"
COL_PHONE = "Phone"        # Matches "Phone", "Phone Number", "Mobile"
COL_ADDRESS = "Address"
COL_GOTHRA = "Gothra"
COL_DATE = "Date"          # Matches "Date", "Pooje Date"
COL_TYPE = "Type"          # To distinguish General vs Brahmachari (optional)

def clean_phone(phone_val):
    """Standardizes phone numbers to 10 digits."""
    if pd.isna(phone_val): return None
    s = str(phone_val)
    digits = re.sub(r'\D', '', s) # Remove non-digits
    
    # Handle prefixes (91, 0)
    if len(digits) > 10:
        if digits.startswith('91'): digits = digits[2:]
        elif digits.startswith('0'): digits = digits[1:]
    
    if len(digits) == 10:
        return digits
    return None

def parse_date(date_str):
    """Parses '20-May', '20/05', etc. into (Day, Month)."""
    if pd.isna(date_str): return None, None
    try:
        dt_str = str(date_str).strip()
        # Common formats in your Excel sheets
        formats = ["%d-%b", "%d-%b-%Y", "%d/%m", "%d/%m/%Y", "%d-%m-%Y"]
        
        for fmt in formats:
            try:
                # Append dummy year for "Day-Month" formats to help parsing
                if "b" in fmt or fmt == "%d/%m":
                     dt = pd.to_datetime(dt_str + "-2024", format=fmt if fmt != "%d/%m" else "%d/%m/%Y")
                else:
                     dt = pd.to_datetime(dt_str, dayfirst=True)
                return dt.day, dt.month
            except:
                continue
    except:
        pass
    return None, None

def find_column(df, target_keywords):
    """Helper to find a column name that matches one of the keywords (case-insensitive)."""
    for col in df.columns:
        if any(keyword.lower() in col.lower() for keyword in target_keywords):
            return col
    return None

def run_bulk_migration(dry_run=True):
    db = SessionLocal()
    print(f"--- STARTING BULK MIGRATION (Dry Run: {dry_run}) ---")
    print(f"Scanning Directory: {os.path.abspath(DATA_DIR)}")

    # 1. Fetch Seva IDs
    # Adjust these strings if your DB names are different
    general_seva = db.query(SevaCatalog).filter(SevaCatalog.name_eng.ilike("%Shaswata Pooja%")).first()
    brahm_seva = db.query(SevaCatalog).filter(SevaCatalog.name_eng.ilike("%Brahmachari%")).first()

    if not general_seva or not brahm_seva:
        print("❌ CRITICAL ERROR: Could not find Seva IDs. Check 'seva_catalog' table.")
        print("   Ensure 'Shaswata Pooja' and 'Shaswata Brahmachari Pooja' exist.")
        return

    # 2. Find CSV Files Recursively
    all_files = glob.glob(os.path.join(DATA_DIR, "**", "*.csv"), recursive=True)
    print(f"Found {len(all_files)} CSV files in total.")

    total_success = 0
    total_skipped = 0

    # 3. Process Files
    for filepath in all_files:
        filename = os.path.basename(filepath)
        
        # skip temporary or system files
        if filename.startswith("~$") or "Issue" in filename or "Report" in filename:
            continue

        print(f"\n📄 Analyzing: {filename}...")
        
        try:
            # Try reading (UTF-8 or CP1252)
            try:
                df = pd.read_csv(filepath, encoding='utf-8')
            except UnicodeDecodeError:
                df = pd.read_csv(filepath, encoding='cp1252')
            
            # Clean header names
            df.columns = df.columns.str.strip()

            # Identify Columns Dynamically
            name_col = find_column(df, ["Name", "Devotee", "Name of"])
            phone_col = find_column(df, ["Phone", "Mobile", "Contact"])
            
            # If no Name column, it's not a data file. Skip it.
            if not name_col:
                print(f"   ⚠️ Skipping (No 'Name' column found).")
                continue

            gothra_col = find_column(df, ["Gothra"])
            address_col = find_column(df, ["Address", "Place"])
            date_col = find_column(df, ["Date", "Pooje"])
            
            # Determine Seva Type based on File Name or Folder Name
            # (Because separate files often mean separate categories)
            is_brahmachari = "brahmachari" in filename.lower() or "rathotsava" in filename.lower() or "rathotsava" in filepath.lower()

            for index, row in df.iterrows():
                # --- A. Extract Data ---
                name = str(row.get(name_col, '')).strip()
                if not name or name.lower() == 'nan': continue

                phone = clean_phone(row.get(phone_col, '')) if phone_col else None
                gothra = str(row.get(gothra_col, '')).strip() if gothra_col else None
                address = str(row.get(address_col, '')).strip() if address_col else None
                
                # --- B. Classify Seva ---
                if is_brahmachari:
                    target_seva_id = brahm_seva.id
                    sub_type = "RATHOTSAVA"
                    seva_type_val = "BRAHMACHARI"
                    day, month = None, None
                else:
                    # General Shaswata
                    target_seva_id = general_seva.id
                    sub_type = "GREGORIAN"
                    seva_type_val = "GENERAL"
                    day, month = parse_date(row.get(date_col, '')) if date_col else (None, None)
                    
                    if not day:
                        # Only skip if it's strictly General Pooja and date is missing
                        print(f"   ⚠️ Row {index+2}: Skipped (Invalid Date) -> {name}")
                        total_skipped += 1
                        continue

                # --- C. Check/Create Devotee ---
                devotee = None
                if phone:
                    devotee = db.query(Devotee).filter(Devotee.phone_number == phone).first()
                
                # If phone matches, use existing. If not, create new.
                if not devotee:
                    if not dry_run:
                        devotee = Devotee(
                            full_name_en=name, 
                            phone_number=phone, 
                            gothra_en=gothra, 
                            address=address
                        )
                        db.add(devotee)
                        db.flush()
                        print(f"   👤 New Devotee: {name}")
                    else:
                        print(f"   👤 [Dry Run] Would create Devotee: {name}")

                # --- D. Check Duplicates ---
                if devotee and not dry_run:
                    exists = db.query(ShaswataSubscription).filter(
                        ShaswataSubscription.devotee_id == devotee.id,
                        ShaswataSubscription.seva_id == target_seva_id
                    ).first()

                    if exists:
                        print(f"   ⚠️ Duplicate: {name} already has this Seva.")
                        total_skipped += 1
                        continue

                # --- E. Add Subscription ---
                if not dry_run:
                    new_sub = ShaswataSubscription(
                        devotee_id=devotee.id,
                        seva_id=target_seva_id,
                        subscription_type=sub_type,
                        seva_type=seva_type_val,
                        event_day=day,
                        event_month=month,
                        is_active=True
                    )
                    db.add(new_sub)
                    total_success += 1
                    print(f"   ✅ Added: {name} ({seva_type_val})")

        except Exception as e:
            print(f"   ❌ Error reading file {filename}: {e}")

    # 4. Commit
    if not dry_run:
        db.commit()
        print(f"\n🎉 DONE! Added: {total_success}, Skipped: {total_skipped}")
    else:
        print(f"\n🚧 DRY RUN COMPLETE. To execute, change 'dry_run=True' to 'dry_run=False'.")
    
    db.close()

if __name__ == "__main__":
    run_bulk_migration(dry_run=True)
