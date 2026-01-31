"""
BULK MIGRATION SCRIPT: import_bulk_csv.py
Usage: python import_bulk_csv.py
"""
import pandas as pd
import os
import glob
import re
from sqlalchemy.orm import Session
from database import SessionLocal
from models import Devotee, ShaswataSubscription, SevaCatalog

# --- CONFIGURATION ---
# Use raw string (r"...") to handle backslashes in Windows paths
FOLDER_PATH = r"C:\Users\swaro\Desktop\Subramanya Temple App & Registry\2025"

# Expected Column Headers (Make sure ALL your CSVs match this pattern!)
# If your CSVs have different names, rename them first or adjust these variables.
COL_NAME = "Name"
COL_PHONE = "Phone"        # Phone, Phone Number, Mobile
COL_ADDRESS = "Address"
COL_GOTHRA = "Gothra"
COL_DATE = "Date"          # 20-May, 20/05
COL_TYPE = "Type"          # General / Brahmachari

def clean_phone(phone_val):
    """Standardizes phone numbers to 10 digits."""
    if pd.isna(phone_val): return None
    s = str(phone_val)
    # Remove all non-numeric characters
    digits = re.sub(r'\D', '', s)
    
    # Handle prefixes like 91, +91, 0
    if len(digits) > 10:
        if digits.startswith('91'): digits = digits[2:]
        elif digits.startswith('0'): digits = digits[1:]
    
    if len(digits) == 10:
        return digits
    return None

def parse_date(date_str):
    """
    Parses dates like '20-May', '20/05', '20-05-2023'.
    Returns (day, month).
    """
    if pd.isna(date_str): return None, None
    try:
        # Append a dummy year (2024) to help pandas parse "Day-Month" formats
        dt_str = str(date_str).strip()
        # Try a few common formats
        for fmt in ["%d-%b-%Y", "%d/%m/%Y", "%d-%m-%Y", "%d-%b"]:
            try:
                # If format is Day-Month (e.g. 20-May), add year
                if fmt == "%d-%b":
                    dt = pd.to_datetime(dt_str + "-2024", format="%d-%b-%Y")
                else:
                    dt = pd.to_datetime(dt_str, dayfirst=True) # Assume Day First for India
                return dt.day, dt.month
            except:
                continue
    except:
        pass
    return None, None

def run_bulk_migration(dry_run=True):
    db = SessionLocal()
    print(f"--- STARTING BULK MIGRATION (Dry Run: {dry_run}) ---")
    print(f"Looking in: {FOLDER_PATH}")

    # 1. Find all CSV files
    all_files = glob.glob(os.path.join(FOLDER_PATH, "*.csv"))
    print(f"Found {len(all_files)} CSV files.")

    # 2. Get Seva IDs
    # Using name_eng to match the actual SevaCatalog model
    general_seva = db.query(SevaCatalog).filter(SevaCatalog.name_eng.ilike("%Shaswata Pooja%")).first()
    brahm_seva = db.query(SevaCatalog).filter(SevaCatalog.name_eng.ilike("%Brahmachari%")).first()

    if not general_seva or not brahm_seva:
        print("CRITICAL ERROR: Could not find Seva IDs. Check SevaCatalog table.")
        print("Available Sevas:")
        for seva in db.query(SevaCatalog).all():
            print(f"  - {seva.id}: {seva.name_eng}")
        return

    total_success = 0
    total_skipped = 0

    # 3. Loop through files
    for filepath in all_files:
        filename = os.path.basename(filepath)
        print(f"\n📄 Processing: {filename}...")
        
        try:
            # Try reading with different encodings if UTF-8 fails
            try:
                df = pd.read_csv(filepath, encoding='utf-8')
            except UnicodeDecodeError:
                df = pd.read_csv(filepath, encoding='cp1252') # Common for Excel CSVs
            
            # Normalize column names (strip spaces, lower case for matching)
            # This helps if one file has "Name " and another has "Name"
            df.columns = df.columns.str.strip()
            
            # Process Rows
            for index, row in df.iterrows():
                # --- A. Extract Data ---
                # Check if columns exist
                if COL_NAME not in df.columns:
                    print(f"   ⚠️ Skipping file (Missing '{COL_NAME}' column)")
                    break

                name = str(row.get(COL_NAME, '')).strip()
                phone = clean_phone(row.get(COL_PHONE, ''))
                gothra = str(row.get(COL_GOTHRA, '')).strip()
                address = str(row.get(COL_ADDRESS, '')).strip()
                raw_type = str(row.get(COL_TYPE, '')).lower()
                
                # --- B. Determine Logic ---
                sub_type = "GREGORIAN"
                day, month = None, None
                target_seva_id = general_seva.id

                if "brahmachari" in raw_type or "rathotsava" in raw_type:
                    target_seva_id = brahm_seva.id
                    sub_type = "RATHOTSAVA"
                else:
                    # General Shaswata
                    target_seva_id = general_seva.id
                    day, month = parse_date(row.get(COL_DATE, ''))
                    if not day:
                        # If date is missing for general pooja, check if it's Lunar?
                        # For now, skip invalid dates for general
                        print(f"   ❌ Row {index+2}: Invalid Date '{row.get(COL_DATE)}' for {name}")
                        total_skipped += 1
                        continue

                # --- C. Check/Create Devotee ---
                devotee = None
                if phone:
                    devotee = db.query(Devotee).filter(Devotee.phone_number == phone).first()
                
                if not devotee:
                    # If phone missing, try matching EXACT Name + Gothra (Optional but risky)
                    # Let's create new if unique
                    if not dry_run:
                        # Using full_name_en and gothra_en to match the actual Devotee model
                        devotee = Devotee(full_name_en=name, phone_number=phone, gothra_en=gothra, address=address)
                        db.add(devotee)
                        db.flush()
                        print(f"   👤 New Devotee: {name}")
                    else:
                        print(f"   👤 [Dry Run] Would create: {name}")

                # --- D. Check Duplicate Subscription ---
                if devotee and not dry_run:
                    exists = db.query(ShaswataSubscription).filter(
                        ShaswataSubscription.devotee_id == devotee.id,
                        ShaswataSubscription.seva_id == target_seva_id
                    ).first()
                    
                    if exists:
                        print(f"   ⚠️ Duplicate: {name} already has this Seva.")
                        total_skipped += 1
                        continue

                # --- E. Create Subscription ---
                if not dry_run:
                    new_sub = ShaswataSubscription(
                        devotee_id=devotee.id,
                        seva_id=target_seva_id,
                        subscription_type=sub_type,
                        event_day=day,
                        event_month=month,
                        is_active=True
                    )
                    db.add(new_sub)
                    total_success += 1
                    print(f"   ✅ Added Seva: {name} ({sub_type})")

        except Exception as e:
            print(f"   ❌ CRITICAL ERROR reading file {filename}: {e}")

    # 4. Final Commit
    if not dry_run:
        db.commit()
        print(f"\n🎉 ALL DONE! Successfully added: {total_success}, Skipped: {total_skipped}")
    else:
        print(f"\n🚧 DRY RUN FINISHED. Validated {len(all_files)} files.")
        print("To run for real, change 'dry_run=True' to 'dry_run=False' in the code.")
    
    db.close()

if __name__ == "__main__":
    # RUN THIS FIRST!
    run_bulk_migration(dry_run=True)
