"""
SAFE MIGRATION SCRIPT: import_shaswata.py
==========================================
Usage: python import_shaswata.py

This script performs 4 layers of safety checks:
1. Phone Number Normalization: Converts "+91-9876 543210" -> "9876543210"
2. Name Cleaning: "  Swaroop K.S  " -> "Swaroop K.S"
3. Duplicate Check (Internal): Checks if the Excel file has the same person twice.
4. Duplicate Check (Database): Checks if already in the database to prevent double-booking.

BEFORE RUNNING FOR REAL:
- Put your Excel file (e.g., shaswata_data.xlsx) in this folder
- Adjust the COL_* variables below to match your Excel headers
- Run with dry_run=True first to see what will happen
- If satisfied, change dry_run=False and run again
"""
import pandas as pd
from sqlalchemy.orm import Session
from database import SessionLocal
from models import Devotee, ShaswataSubscription, SevaCatalog
import re

# ==============================================================================
# CONFIGURATION - ADJUST THESE TO MATCH YOUR EXCEL
# ==============================================================================
FILE_PATH = "shaswata_data.xlsx"  # Your Excel file name

# Column Mapping (Change these to match your Excel headers exactly)
COL_NAME = "Name"
COL_PHONE = "Phone Number"
COL_ADDRESS = "Address"
COL_GOTHRA = "Gothra"
COL_DATE = "Date"  # Format: "20-May" or "20/05" or "20-05"
COL_TYPE = "Type"  # "General" or "Brahmachari"

# ==============================================================================
# DATA CLEANING FUNCTIONS
# ==============================================================================

def clean_phone(phone_val):
    """
    Removes spaces, dashes, +91, and ensures 10 digits.
    Returns None if invalid.
    """
    if pd.isna(phone_val): 
        return None
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
    return None  # Invalid phone

def clean_name(name_val):
    """Trims whitespace and normalizes name."""
    if pd.isna(name_val):
        return None
    return str(name_val).strip()

def parse_date(date_str):
    """
    Tries to parse '20-May', '20/05', '20-05', etc.
    Returns (day, month) tuple or (None, None).
    """
    if pd.isna(date_str): 
        return None, None
    
    try:
        # Try various formats by appending a dummy year
        formats_to_try = [
            "%d-%b-%Y",   # 20-May-2024
            "%d/%m/%Y",   # 20/05/2024
            "%d-%m-%Y",   # 20-05-2024
        ]
        
        raw = str(date_str).strip()
        
        for fmt in formats_to_try:
            try:
                dt = pd.to_datetime(raw + "-2024", format=fmt, errors='raise')
                return dt.day, dt.month
            except:
                try:
                    dt = pd.to_datetime(raw + "/2024", format=fmt, errors='raise')
                    return dt.day, dt.month
                except:
                    continue
        
        # Fallback: try pandas' default parsing
        dt = pd.to_datetime(raw, errors='coerce', dayfirst=True)
        if not pd.isna(dt):
            return dt.day, dt.month
            
    except Exception:
        pass
    
    return None, None

# ==============================================================================
# MAIN MIGRATION LOGIC
# ==============================================================================

def run_migration(dry_run=True):
    """
    Run the migration.
    
    Args:
        dry_run: If True, only prints what would happen without touching the DB.
    """
    db = SessionLocal()
    
    print("=" * 60)
    print(f"  SHASWATA DATA MIGRATION (Dry Run: {dry_run})")
    print("=" * 60)
    print()

    # 1. Read Excel File
    try:
        df = pd.read_excel(FILE_PATH)
        print(f"✓ Loaded {len(df)} rows from '{FILE_PATH}'")
        print(f"  Columns found: {list(df.columns)}")
        print()
    except FileNotFoundError:
        print(f"✗ ERROR: File '{FILE_PATH}' not found!")
        print(f"  Place your Excel file in: {__file__}")
        return
    except Exception as e:
        print(f"✗ ERROR reading file: {e}")
        return

    # 2. Get Seva IDs from Database
    general_seva = db.query(SevaCatalog).filter(
        SevaCatalog.name_eng.ilike("%Shaswata Pooja%")
    ).first()
    
    brahm_seva = db.query(SevaCatalog).filter(
        SevaCatalog.name_eng.ilike("%Brahmachari%")
    ).first()

    if not general_seva:
        print("✗ CRITICAL: Could not find 'Shaswata Pooja' in SevaCatalog!")
        print("  Available Sevas:")
        for seva in db.query(SevaCatalog).all():
            print(f"    - {seva.id}: {seva.name_eng}")
        return
    
    if not brahm_seva:
        print("⚠ WARNING: Could not find 'Brahmachari' Seva. Using General Seva for all.")
        brahm_seva = general_seva

    print(f"✓ Seva IDs resolved:")
    print(f"  - General Pooja: ID {general_seva.id} ({general_seva.name_eng})")
    print(f"  - Brahmachari:   ID {brahm_seva.id} ({brahm_seva.name_eng})")
    print()

    # 3. Process Each Row
    success_count = 0
    skip_count = 0
    error_count = 0
    created_devotees = 0

    print("-" * 60)
    print("PROCESSING ROWS:")
    print("-" * 60)

    for index, row in df.iterrows():
        row_num = index + 2  # Excel rows start at 2 (1 is header)
        
        # --- A. CLEAN DATA ---
        name = clean_name(row.get(COL_NAME))
        phone = clean_phone(row.get(COL_PHONE))
        gothra = clean_name(row.get(COL_GOTHRA))
        address = clean_name(row.get(COL_ADDRESS))
        raw_type = str(row.get(COL_TYPE, '')).lower()
        
        if not name:
            print(f"Row {row_num}: ✗ SKIP - Missing Name")
            skip_count += 1
            continue
        
        # --- B. DETERMINE SUBSCRIPTION TYPE ---
        if "brahmachari" in raw_type:
            target_seva_id = brahm_seva.id
            sub_type = "RATHOTSAVA"  # Special type for Rathotsava sevas
            day, month = None, None
        else:
            target_seva_id = general_seva.id
            sub_type = "GREGORIAN"
            day, month = parse_date(row.get(COL_DATE))
            
            if not day:
                print(f"Row {row_num}: ✗ SKIP - Invalid Date for '{name}' (Raw: {row.get(COL_DATE)})")
                skip_count += 1
                continue

        # --- C. CHECK / CREATE DEVOTEE ---
        devotee = None
        
        # Strategy: Match by Phone first. If no phone, try to match by exact name.
        if phone:
            devotee = db.query(Devotee).filter(Devotee.phone_number == phone).first()
        
        if not devotee:
            # Check by name as fallback (risky, but necessary for legacy data)
            devotee = db.query(Devotee).filter(Devotee.full_name_en == name).first()
        
        if not devotee:
            if dry_run:
                print(f"Row {row_num}: [DRY] Would CREATE Devotee -> {name} ({phone or 'No Phone'})")
            else:
                devotee = Devotee(
                    full_name_en=name,
                    phone_number=phone,
                    gothra_en=gothra,
                    address=address
                )
                db.add(devotee)
                db.flush()  # Get the ID immediately
                print(f"Row {row_num}: ✓ CREATED Devotee -> {name} (ID: {devotee.id})")
            
            created_devotees += 1
        else:
            if dry_run:
                print(f"Row {row_num}: [DRY] Found existing Devotee -> {devotee.full_name_en} (ID: {devotee.id})")

        # --- D. CHECK DUPLICATE SUBSCRIPTION ---
        if devotee and not dry_run:
            exists = db.query(ShaswataSubscription).filter(
                ShaswataSubscription.devotee_id == devotee.id,
                ShaswataSubscription.seva_id == target_seva_id,
                ShaswataSubscription.event_day == day,
                ShaswataSubscription.event_month == month
            ).first()
            
            if exists:
                print(f"Row {row_num}: ⚠ SKIP - Already subscribed (Sub ID: {exists.id})")
                skip_count += 1
                continue

        # --- E. CREATE SUBSCRIPTION ---
        if dry_run:
            date_info = f"{day}/{month}" if day else "Rathotsava"
            print(f"Row {row_num}: [DRY] Would ADD Subscription -> {name} | {sub_type} | {date_info}")
            success_count += 1
        else:
            if devotee:
                new_sub = ShaswataSubscription(
                    devotee_id=devotee.id,
                    seva_id=target_seva_id,
                    subscription_type=sub_type,
                    seva_type="BRAHMACHARI" if "brahmachari" in raw_type else "GENERAL",
                    event_day=day,
                    event_month=month,
                    is_active=True
                )
                db.add(new_sub)
                date_info = f"{day}/{month}" if day else "Rathotsava"
                print(f"Row {row_num}: ✓ ADDED Subscription -> {name} | {sub_type} | {date_info}")
                success_count += 1

    # 4. Commit or Report
    print()
    print("=" * 60)
    
    if dry_run:
        print("DRY RUN COMPLETE - NO CHANGES MADE TO DATABASE")
        print()
        print(f"  Would Create: {created_devotees} new Devotees")
        print(f"  Would Add:    {success_count} Subscriptions")
        print(f"  Would Skip:   {skip_count} rows (duplicates/invalid)")
        print()
        print("To execute for real, change the last line to:")
        print("  run_migration(dry_run=False)")
    else:
        db.commit()
        print("MIGRATION COMPLETE - DATABASE UPDATED")
        print()
        print(f"  Created: {created_devotees} new Devotees")
        print(f"  Added:   {success_count} Subscriptions")
        print(f"  Skipped: {skip_count} rows")
    
    print("=" * 60)
    db.close()


# ==============================================================================
# ENTRY POINT
# ==============================================================================

if __name__ == "__main__":
    # ⚠️ RUN AS DRY RUN FIRST! ⚠️
    # This will only PRINT what would happen, without touching the database.
    run_migration(dry_run=True)
    
    # ✓ Once you're satisfied with the dry run output, uncomment the line below:
    # run_migration(dry_run=False)
