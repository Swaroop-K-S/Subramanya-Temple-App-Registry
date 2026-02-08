import csv
import logging
from datetime import datetime
from difflib import get_close_matches
from sqlalchemy.orm import Session
from database import SessionLocal
from crud import create_transaction
from schemas import TransactionCreate

# Configure Logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - [LEGACY_ERASER] - %(message)s')
logger = logging.getLogger("LegacyEraser")

# Target Schema Fields
TARGET_FIELDS = {
    "devotee_name": ["name", "nm", "devotee", "full_name", "bhakta"],
    "phone_number": ["phone", "ph", "mobile", "cell", "contact"],
    "gothra": ["gothra", "gotra", "gtra", "clan"],
    "nakshatra": ["nakshatra", "star", "janma_nakshatra"],
    "amount": ["amount", "amt", "price", "paise", "rs"],
    "notes": ["notes", "remarks", "comment"],
    "date": ["date", "dt", "transaction_date"]
}

def map_header(header, choices):
    """Fuzzy match specific header to target fields"""
    header = header.lower().strip()
    for field, aliases in TARGET_FIELDS.items():
        if header == field or header in aliases:
            return field
        # Fuzzy check
        matches = get_close_matches(header, aliases, n=1, cutoff=0.7)
        if matches:
            return field
    return None

import pdfplumber

def extract_pdf_table(pdf_path):
    """Extracts tables from PDF and flattens them into list of lists"""
    all_rows = []
    try:
        with pdfplumber.open(pdf_path) as pdf:
            for page in pdf.pages:
                tables = page.extract_tables()
                for table in tables:
                    for row in table:
                        # Clean row: remove None and strip strings
                        cleaned_row = [str(cell).strip() if cell else "" for cell in row]
                        # Skip empty rows
                        if any(cleaned_row):
                            all_rows.append(cleaned_row)
        return all_rows
    except Exception as e:
        logger.error(f"Failed to parse PDF {pdf_path}: {e}")
        return []

def migrate_legacy_data(file_path):
    logger.info(f"Opening Portal to 2010... Reading {file_path}")
    
    db = SessionLocal()
    success_count = 0
    fail_count = 0

    try:
        rows = []
        headers = []
        
        # DETECT FILE TYPE
        if file_path.lower().endswith('.pdf'):
            logger.info("Detected Ancient Scroll (PDF)... Extracting Tables.")
            raw_data = extract_pdf_table(file_path)
            if not raw_data:
                logger.error("No data found in PDF.")
                return
            headers = raw_data[0]
            rows = raw_data[1:]
        else:
            # Assume CSV
            with open(file_path, 'r') as f:
                reader = csv.reader(f)
                headers = next(reader)
                rows = list(reader)
                
        # 1. Inspect Headers and Build Map
        col_map = {} # index -> target_field
        logger.info("Analyzing Ancient Headers...")
        for idx, h in enumerate(headers):
            target = map_header(h, TARGET_FIELDS)
            if target:
                col_map[idx] = target
                logger.info(f"  >> Mapped '{h}' -> '{target}'")
        
        # 2. Ingest Rows
        for row in rows:
            data = {}
            for idx, val in enumerate(row):
                if idx in col_map:
                    data[col_map[idx]] = val
            
            # Default Logic / Cleaning
            if "devotee_name" not in data or not data["devotee_name"]:
                continue
            
            try:
                # Construct Payload
                tx = TransactionCreate(
                    devotee_name=data["devotee_name"],
                    phone_number=data.get("phone_number", "0000000000"),
                    gothra=data.get("gothra"),
                    nakshatra=data.get("nakshatra"),
                    seva_id=1, # Default to Archana (1) for legacy
                    amount=float(data.get("amount", 0)),
                    payment_mode="CASH", # Assumptions
                    # Date handling skipped for minimal example, uses today
                )
                
                create_transaction(db, tx)
                success_count += 1
                # logger.info(f"Restored record: {tx.devotee_name}")
            except Exception as e:
                logger.error(f"Failed to migrate row {row}: {e}")
                fail_count += 1

        logger.info(f"MIGRATION COMPLETE. Restored {success_count} souls. Lost {fail_count}.")

    except Exception as e:
        logger.error(f"Critical Failure: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    migrate_legacy_data("legacy_data.csv")
