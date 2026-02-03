"""
DATA CLEANING SCRIPT: clean_data.py
Usage: python clean_data.py

This script:
1. Scans all Excel files in the 2025 folder
2. Cleans phone numbers, names, dates
3. Exports clean CSVs to a 'cleaned_data' folder
4. Generates a summary report
"""
import pandas as pd
import os
import glob
import re
from datetime import datetime

# --- CONFIGURATION ---
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "..", "2025")
OUTPUT_DIR = os.path.join(BASE_DIR, "..", "2025_cleaned")

# Files to skip
SKIP_PATTERNS = ["~$", "Issue", "Report", "Gothra List", "Display", "Samithi"]

def clean_phone(phone_val):
    """Standardizes phone numbers to 10 digits."""
    if pd.isna(phone_val): 
        return None
    s = str(phone_val).strip()
    
    # Remove all non-numeric characters
    digits = re.sub(r'\D', '', s)
    
    # Handle prefixes (91, 0)
    if len(digits) > 10:
        if digits.startswith('91'): 
            digits = digits[2:]
        elif digits.startswith('0'): 
            digits = digits[1:]
    
    if len(digits) == 10:
        return digits
    elif len(digits) == 0:
        return None
    else:
        return f"INVALID({s})"  # Mark invalid for review

def clean_name(name_val):
    """Cleans and standardizes names."""
    if pd.isna(name_val):
        return None
    name = str(name_val).strip()
    
    # Remove multiple spaces
    name = re.sub(r'\s+', ' ', name)
    
    # Title case
    name = name.title()
    
    # Remove invalid entries
    if name.lower() in ['nan', 'none', '', '-', 'n/a']:
        return None
    
    return name

def parse_date(date_val):
    """Parses various date formats and returns DD-MMM format."""
    if pd.isna(date_val):
        return None
    
    try:
        dt_str = str(date_val).strip()
        
        # Handle already formatted dates like "20-May"
        if re.match(r'^\d{1,2}-[A-Za-z]{3}$', dt_str):
            return dt_str
        
        # Try parsing various formats
        formats = [
            "%d-%b-%Y", "%d/%m/%Y", "%d-%m-%Y", "%Y-%m-%d",
            "%d-%b", "%d/%m", "%d-%m"
        ]
        
        for fmt in formats:
            try:
                if fmt in ["%d-%b", "%d/%m", "%d-%m"]:
                    # Add dummy year
                    dt = datetime.strptime(dt_str + "-2024", fmt.replace(fmt, fmt + "-%Y"))
                else:
                    dt = datetime.strptime(dt_str, fmt)
                return dt.strftime("%d-%b")  # Return as "20-May"
            except:
                continue
        
        # If all else fails, try pandas
        dt = pd.to_datetime(dt_str, dayfirst=True, errors='coerce')
        if not pd.isna(dt):
            return dt.strftime("%d-%b")
            
    except:
        pass
    
    return f"INVALID({date_val})"  # Mark for review

def find_column(columns, keywords):
    """Find a column that matches any of the keywords."""
    for col in columns:
        col_lower = str(col).lower().strip()
        for keyword in keywords:
            if keyword.lower() in col_lower:
                return col
    return None

def clean_file(filepath):
    """Clean a single Excel file and return a DataFrame."""
    filename = os.path.basename(filepath)
    
    # Skip files matching patterns
    for pattern in SKIP_PATTERNS:
        if pattern.lower() in filename.lower():
            return None, f"Skipped (matches '{pattern}')"
    
    try:
        # Read Excel file
        df = pd.read_excel(filepath)
        
        if df.empty:
            return None, "Empty file"
        
        # Normalize column names
        df.columns = df.columns.str.strip()
        
        # Find relevant columns
        name_col = find_column(df.columns, ["Name", "Devotee", "Name of"])
        phone_col = find_column(df.columns, ["Phone", "Mobile", "Contact", "Cell"])
        gothra_col = find_column(df.columns, ["Gothra", "Gotra"])
        address_col = find_column(df.columns, ["Address", "Place", "City"])
        date_col = find_column(df.columns, ["Date", "Pooje", "Day"])
        
        if not name_col:
            return None, "No 'Name' column found"
        
        # Create cleaned DataFrame
        cleaned = pd.DataFrame()
        
        # Clean each column
        cleaned["Name"] = df[name_col].apply(clean_name)
        
        if phone_col:
            cleaned["Phone"] = df[phone_col].apply(clean_phone)
        else:
            cleaned["Phone"] = None
            
        if gothra_col:
            cleaned["Gothra"] = df[gothra_col].apply(clean_name)
        else:
            cleaned["Gothra"] = None
            
        if address_col:
            cleaned["Address"] = df[address_col].apply(lambda x: str(x).strip() if pd.notna(x) else None)
        else:
            cleaned["Address"] = None
            
        if date_col:
            cleaned["Date"] = df[date_col].apply(parse_date)
        else:
            cleaned["Date"] = None
        
        # Determine Type based on file/folder name
        if "brahmachari" in filepath.lower() or "rathotsava" in filepath.lower():
            cleaned["Type"] = "Brahmachari"
        else:
            cleaned["Type"] = "General"
        
        # Remove rows with no name
        cleaned = cleaned.dropna(subset=["Name"])
        
        # Remove complete duplicates
        cleaned = cleaned.drop_duplicates()
        
        return cleaned, f"Cleaned {len(cleaned)} rows"
        
    except Exception as e:
        return None, f"Error: {str(e)}"

def run_cleaning():
    """Main cleaning function."""
    print("=" * 60)
    print("  DATA CLEANING SCRIPT")
    print("=" * 60)
    print(f"\nSource: {os.path.abspath(DATA_DIR)}")
    print(f"Output: {os.path.abspath(OUTPUT_DIR)}")
    
    # Create output directory
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    
    # Find all Excel files
    all_files = glob.glob(os.path.join(DATA_DIR, "**", "*.xlsx"), recursive=True)
    print(f"\nFound {len(all_files)} Excel files.\n")
    
    all_cleaned = []
    report = []
    
    for filepath in all_files:
        rel_path = os.path.relpath(filepath, DATA_DIR)
        print(f"📄 {rel_path}...")
        
        cleaned_df, status = clean_file(filepath)
        
        if cleaned_df is not None and not cleaned_df.empty:
            all_cleaned.append(cleaned_df)
            print(f"   ✅ {status}")
            
            # Count issues
            invalid_phones = cleaned_df["Phone"].str.contains("INVALID", na=False).sum()
            invalid_dates = cleaned_df["Date"].str.contains("INVALID", na=False).sum()
            
            if invalid_phones > 0:
                print(f"   ⚠️  {invalid_phones} invalid phone numbers")
            if invalid_dates > 0:
                print(f"   ⚠️  {invalid_dates} invalid dates")
                
            report.append({
                "File": rel_path,
                "Status": "Cleaned",
                "Rows": len(cleaned_df),
                "Invalid Phones": invalid_phones,
                "Invalid Dates": invalid_dates
            })
        else:
            print(f"   ⏭️  {status}")
            report.append({
                "File": rel_path,
                "Status": status,
                "Rows": 0,
                "Invalid Phones": 0,
                "Invalid Dates": 0
            })
    
    # Combine all cleaned data
    if all_cleaned:
        combined = pd.concat(all_cleaned, ignore_index=True)
        
        # Remove cross-file duplicates (same phone number)
        before_dedup = len(combined)
        combined = combined.drop_duplicates(subset=["Phone"], keep="first")
        after_dedup = len(combined)
        
        print(f"\n{'=' * 60}")
        print(f"SUMMARY")
        print(f"{'=' * 60}")
        print(f"Total rows cleaned: {before_dedup}")
        print(f"After deduplication: {after_dedup}")
        print(f"Duplicates removed: {before_dedup - after_dedup}")
        
        # Split by type
        general = combined[combined["Type"] == "General"]
        brahmachari = combined[combined["Type"] == "Brahmachari"]
        
        # Save to CSV
        general_path = os.path.join(OUTPUT_DIR, "shaswata_general_cleaned.csv")
        brahm_path = os.path.join(OUTPUT_DIR, "shaswata_brahmachari_cleaned.csv")
        
        general.to_csv(general_path, index=False)
        brahmachari.to_csv(brahm_path, index=False)
        
        print(f"\n📁 Output Files:")
        print(f"   - {general_path} ({len(general)} rows)")
        print(f"   - {brahm_path} ({len(brahmachari)} rows)")
        
        # Save report
        report_df = pd.DataFrame(report)
        report_path = os.path.join(OUTPUT_DIR, "cleaning_report.csv")
        report_df.to_csv(report_path, index=False)
        print(f"   - {report_path}")
        
        # Show items needing manual review
        needs_review = combined[
            combined["Phone"].str.contains("INVALID", na=False) |
            combined["Date"].str.contains("INVALID", na=False)
        ]
        
        if len(needs_review) > 0:
            review_path = os.path.join(OUTPUT_DIR, "needs_review.csv")
            needs_review.to_csv(review_path, index=False)
            print(f"\n⚠️  {len(needs_review)} rows need manual review: {review_path}")
        
        print(f"\n✅ CLEANING COMPLETE!")
    else:
        print("\n❌ No data was cleaned. Check the file formats.")

if __name__ == "__main__":
    run_cleaning()
