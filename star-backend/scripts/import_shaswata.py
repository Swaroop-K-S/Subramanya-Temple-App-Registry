"""
SAFE MIGRATION SCRIPT: import_shaswata.py
Usage: python import_shaswata.py
"""
import pandas as pd
from sqlalchemy.orm import Session
from app.database import SessionLocal, engine
from app.models import Devotee, ShaswataSubscription, SevaCatalog
import re

# --- CONFIGURATION ---
FILE_PATH = "shaswata_data.xlsx"  # Put your Excel file name here
# Column Mapping (Change these to match your Excel headers exactly)
COL_NAME = "Name"
COL_PHONE = "Phone Number"
COL_ADDRESS = "Address"
COL_GOTHRA = "Gothra"
COL_DATE = "Date"  # Format: "20-May" or "20/05"
COL_TYPE = "Type"  # "General" or "Brahmachari"

def clean_phone(phone_val):
    """Removes spaces, dashes, +91, and ensures 10 digits."""
    if pd.isna(phone_val): return None
    s = str(phone_val)
    # Remove non-digits
    digits = re.sub(r'\D', '', s)
    # Handle +91 or 0 prefix
    if len(digits) > 10 and digits.startswith('91'):
        digits = digits[2:]
    elif len(digits) > 10 and digits.startswith('0'):
        digits = digits[1:]
    
    if len(digits) == 10:
        return digits
    return None # Invalid phone

def parse_date(date_str):
    """
    Tries to parse '20-May', '20/05', etc.
    Returns (day, month) tuple or (None, None).
    """
    if pd.isna(date_str): return None, None
    try:
        # Append a dummy year to make parsing easier
        dt = pd.to_datetime(str(date_str) + "-2024", format="%d-%b-%Y", errors='coerce')
        if pd.isna(dt):
             dt = pd.to_datetime(str(date_str) + "/2024", format="%d/%m/%Y", errors='coerce')
        
        if not pd.isna(dt):
            return dt.day, dt.month
    except:
        pass
    return None, None

def run_migration(dry_run=True):
    db = SessionLocal()
    print(f"--- STARTING MIGRATION (Dry Run: {dry_run}) ---")

    # 1. Read Excel
    try:
        df = pd.read_excel(FILE_PATH)
        print(f"Loaded {len(df)} rows from Excel.")
    except Exception as e:
        print(f"Error reading file: {e}")
        return

    # 2. Get Seva IDs (Assuming they exist in DB)
    # Using name_eng to match the actual SevaCatalog model
    general_seva = db.query(SevaCatalog).filter(SevaCatalog.name_eng.ilike("%Shaswata Pooja%")).first()
    brahm_seva = db.query(SevaCatalog).filter(SevaCatalog.name_eng.ilike("%Brahmachari%")).first()

    if not general_seva or not brahm_seva:
        print("CRITICAL ERROR: Could not find Seva IDs in Database. Please check SevaCatalog names.")
        print("Available Sevas:")
        for seva in db.query(SevaCatalog).all():
            print(f"  - {seva.id}: {seva.name_eng}")
        return

    success_count = 0
    skip_count = 0

    for index, row in df.iterrows():
        # --- A. CLEAN DATA ---
        name = str(row[COL_NAME]).strip()
        phone = clean_phone(row[COL_PHONE])
        gothra = str(row[COL_GOTHRA]).strip() if not pd.isna(row[COL_GOTHRA]) else None
        address = str(row[COL_ADDRESS]).strip() if not pd.isna(row[COL_ADDRESS]) else None
        
        raw_type = str(row[COL_TYPE]).lower()
        
        # --- B. DETERMINE TYPE ---
        sub_type = "GREGORIAN"
        day, month = None, None
        
        if "brahmachari" in raw_type:
            target_seva_id = brahm_seva.id
            sub_type = "RATHOTSAVA"
        else:
            target_seva_id = general_seva.id
            # Parse Date
            day, month = parse_date(row[COL_DATE])
            if not day:
                print(f"Row {index+1}: SKIPPING - Invalid Date for General Pooja ({row[COL_DATE]})")
                skip_count += 1
                continue

        # --- C. CHECK / CREATE DEVOTEE ---
        # Strategy: Match by Phone. If no phone, Match by Name (risky, but necessary).
        devotee = None
        if phone:
            devotee = db.query(Devotee).filter(Devotee.phone_number == phone).first()
        
        if not devotee:
            if not dry_run:
                # Using full_name_en and gothra_en to match the actual Devotee model
                devotee = Devotee(
                    full_name_en=name,
                    phone_number=phone,
                    gothra_en=gothra,
                    address=address
                )
                db.add(devotee)
                db.flush() # Get the ID immediately
                print(f"Row {index+1}: Created New Devotee -> {name}")
            else:
                print(f"Row {index+1}: [Dry Run] Would create Devotee -> {name}")

        # --- D. CHECK DUPLICATE SUBSCRIPTION ---
        # Check if this devotee already has THIS subscription
        if devotee and not dry_run:
            exists = db.query(ShaswataSubscription).filter(
                ShaswataSubscription.devotee_id == devotee.id,
                ShaswataSubscription.seva_id == target_seva_id
            ).first()
            
            if exists:
                print(f"Row {index+1}: SKIPPING - Already subscribed.")
                skip_count += 1
                continue

        # --- E. CREATE SUBSCRIPTION ---
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
            success_count += 1
            print(f"Row {index+1}: SUCCESSS -> Added Subscription ({sub_type})")

    if not dry_run:
        db.commit()
        print(f"--- MIGRATION COMPLETE: Added {success_count}, Skipped {skip_count} ---")
    else:
        print(f"--- DRY RUN COMPLETE: Would Add {success_count}, Would Skip {skip_count} ---")
        print("Set dry_run=False in the code to execute for real.")

    db.close()

if __name__ == "__main__":
    # RUN AS DRY RUN FIRST!
    run_migration(dry_run=True)
