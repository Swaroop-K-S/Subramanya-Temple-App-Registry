#!/usr/bin/env python3
"""
S.T.A.R. Backend - Daily Scheduler Script
==========================================
Morning check to find all Shaswata pujas scheduled for today.

Run standalone: python scheduler.py
Or import and call: check_todays_pujas()

This script:
1. Gets today's Gregorian date (day, month)
2. Gets today's Panchangam (Hindu calendar - mock function for now)
3. Queries the database for matching subscriptions
4. Prints a formatted "Morning Sankalpa List"
"""

import sys
from datetime import datetime
from sqlalchemy import text
from database import SessionLocal


# =============================================================================
# MOCK PANCHANGAM FUNCTION
# =============================================================================

def get_todays_panchangam() -> dict:
    """
    Get today's Hindu Panchangam (calendar) details.
    
    🔮 NOTE: This is a MOCK function for testing purposes.
    In production, this would integrate with a Panchangam API or 
    astronomical calculation library (like SwissEph or Drik Panchang API).
    
    Returns:
        dict with maasa, paksha, tithi, and optional nakshatra
    """
    # =========================================================================
    # MOCK DATA - Change these values for testing different scenarios
    # =========================================================================
    mock_panchangam = {
        "maasa": "Kartika",       # Current Hindu month
        "paksha": "Shukla",       # Bright (Shukla) or Dark (Krishna) fortnight
        "tithi": "Purnima",       # Lunar day (Full Moon in this case)
        "nakshatra": "Krittika",  # Birth star (optional)
        "samvatsara": "Shobhakrit",  # Hindu year name (optional)
    }
    
    return mock_panchangam


def get_todays_gregorian() -> dict:
    """
    Get today's Gregorian calendar date.
    
    Returns:
        dict with day (1-31) and month (1-12)
    """
    today = datetime.now()
    return {
        "day": today.day,
        "month": today.month,
        "year": today.year,
        "weekday": today.strftime("%A"),
        "full_date": today.strftime("%B %d, %Y"),
    }


# =============================================================================
# DATABASE QUERIES
# =============================================================================

def get_lunar_subscriptions(db, maasa: str, paksha: str, tithi: str) -> list:
    """
    Find all LUNAR subscriptions matching the given Panchangam.
    
    Args:
        db: Database session
        maasa: Hindu month name
        paksha: Shukla or Krishna
        tithi: Lunar day name
        
    Returns:
        List of matching subscription records
    """
    query = text("""
        SELECT 
            ss.id,
            d.full_name_en,
            d.phone_number,
            d.gothra_en,
            sc.name_eng as seva_name,
            ss.maasa,
            ss.paksha,
            ss.tithi,
            ss.notes,
            ss.last_performed_year
        FROM shaswata_subscriptions ss
        JOIN devotees d ON ss.devotee_id = d.id
        JOIN seva_catalog sc ON ss.seva_id = sc.id
        WHERE ss.is_active = TRUE
          AND ss.subscription_type = 'LUNAR'
          AND ss.maasa = :maasa
          AND ss.paksha = :paksha
          AND ss.tithi = :tithi
        ORDER BY d.full_name_en
    """)
    
    result = db.execute(query, {"maasa": maasa, "paksha": paksha, "tithi": tithi}).fetchall()
    
    return [
        {
            "id": row[0],
            "devotee_name": row[1],
            "phone": row[2],
            "gothra": row[3],
            "seva_name": row[4],
            "date_info": f"{row[5]} {row[6]} {row[7]}",
            "notes": row[8],
            "last_performed": row[9],
            "type": "LUNAR"
        }
        for row in result
    ]


def get_gregorian_subscriptions(db, day: int, month: int) -> list:
    """
    Find all GREGORIAN subscriptions matching today's date.
    
    Args:
        db: Database session
        day: Day of month (1-31)
        month: Month (1-12)
        
    Returns:
        List of matching subscription records
    """
    query = text("""
        SELECT 
            ss.id,
            d.full_name_en,
            d.phone_number,
            d.gothra_en,
            sc.name_eng as seva_name,
            ss.event_day,
            ss.event_month,
            ss.notes,
            ss.last_performed_year
        FROM shaswata_subscriptions ss
        JOIN devotees d ON ss.devotee_id = d.id
        JOIN seva_catalog sc ON ss.seva_id = sc.id
        WHERE ss.is_active = TRUE
          AND ss.subscription_type = 'GREGORIAN'
          AND ss.event_day = :day
          AND ss.event_month = :month
        ORDER BY d.full_name_en
    """)
    
    result = db.execute(query, {"day": day, "month": month}).fetchall()
    
    # Month names for display
    month_names = ["", "January", "February", "March", "April", "May", "June",
                   "July", "August", "September", "October", "November", "December"]
    
    return [
        {
            "id": row[0],
            "devotee_name": row[1],
            "phone": row[2],
            "gothra": row[3],
            "seva_name": row[4],
            "date_info": f"{month_names[row[6]]} {row[5]}",
            "notes": row[7],
            "last_performed": row[8],
            "type": "GREGORIAN"
        }
        for row in result
    ]


# =============================================================================
# MAIN SCHEDULER FUNCTION
# =============================================================================

def check_todays_pujas() -> dict:
    """
    Main function to check all pujas scheduled for today.
    
    This function:
    1. Gets today's Gregorian date
    2. Gets today's Panchangam (mock)
    3. Queries database for matching subscriptions
    4. Prints formatted morning report
    5. Returns the data for further processing
    
    Returns:
        dict with today's calendar info and matching subscriptions
    """
    print("\n" + "=" * 70)
    print("[NAMASTE] S.T.A.R. - DAILY SCHEDULER")
    print("         Subramanya Temple App & Registry - Tarikere")
    print("=" * 70)
    
    # Get today's dates
    # Windows Console Fix: Force UTF-8 for emojis
    if sys.platform == "win32":
        sys.stdout.reconfigure(encoding='utf-8')

    gregorian = get_todays_gregorian()
    panchangam = get_todays_panchangam()
    
    # Print header
    print(f"\n[SUN] Suprabhata! Good Morning!")
    print(f"[DATE] Today is {gregorian['weekday']}, {gregorian['full_date']}")
    print(f"[MOON] Panchangam: {panchangam['maasa']} {panchangam['paksha']} {panchangam['tithi']}")
    if panchangam.get('nakshatra'):
        print(f"[STAR] Nakshatra: {panchangam['nakshatra']}")
    print("-" * 70)
    
    # Connect to database
    db = SessionLocal()
    
    try:
        # Query for Gregorian (birthday) subscriptions
        gregorian_subs = get_gregorian_subscriptions(
            db, 
            gregorian['day'], 
            gregorian['month']
        )
        
        # Query for Lunar (tithi) subscriptions
        lunar_subs = get_lunar_subscriptions(
            db,
            panchangam['maasa'],
            panchangam['paksha'],
            panchangam['tithi']
        )
        
        # Combine all subscriptions
        all_pujas = lunar_subs + gregorian_subs
        total_count = len(all_pujas)
        
        # Print report
        if total_count == 0:
            print("\n[LIST] No Shaswata Pujas scheduled for today.")
            print("       It's a peaceful day! Om Shanti!")
        else:
            print(f"\n[LIST] TODAY'S SANKALPA LIST ({total_count} Puja{'s' if total_count > 1 else ''})")
            print("-" * 70)
            
            # Print Lunar subscriptions first
            if lunar_subs:
                print(f"\n[LUNAR] LUNAR (Tithi-based) - {len(lunar_subs)} subscription(s):")
                for i, sub in enumerate(lunar_subs, 1):
                    gothra_info = f" | Gothra: {sub['gothra']}" if sub['gothra'] else ""
                    notes_info = f" | {sub['notes']}" if sub['notes'] else ""
                    print(f"   {i}. {sub['devotee_name']}{gothra_info}")
                    print(f"      Phone: {sub['phone']} | {sub['seva_name']}{notes_info}")
            
            # Print Gregorian subscriptions
            if gregorian_subs:
                print(f"\n[BDAY] GREGORIAN (Birthday/Anniversary) - {len(gregorian_subs)} subscription(s):")
                start_num = len(lunar_subs) + 1
                for i, sub in enumerate(gregorian_subs, start_num):
                    gothra_info = f" | Gothra: {sub['gothra']}" if sub['gothra'] else ""
                    notes_info = f" | {sub['notes']}" if sub['notes'] else ""
                    print(f"   {i}. {sub['devotee_name']}{gothra_info}")
                    print(f"      Phone: {sub['phone']} | {sub['seva_name']}{notes_info}")
        
        print("\n" + "=" * 70)
        print("[NAMASTE] Sarve Jana Sukhino Bhavantu | May all beings be happy!")
        print("=" * 70 + "\n")
        
        # Return data for programmatic use
        return {
            "date": gregorian,
            "panchangam": panchangam,
            "lunar_subscriptions": lunar_subs,
            "gregorian_subscriptions": gregorian_subs,
            "total_count": total_count
        }
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        raise e
        
    finally:
        db.close()


def update_last_performed(subscription_id: int, year: int = None):
    """
    Mark a subscription as performed for the current/specified year.
    
    Args:
        subscription_id: ID of the subscription
        year: Year to mark (defaults to current year)
    """
    if year is None:
        year = datetime.now().year
    
    db = SessionLocal()
    try:
        db.execute(
            text("""
                UPDATE shaswata_subscriptions 
                SET last_performed_year = :year, 
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = :id
            """),
            {"year": year, "id": subscription_id}
        )
        db.commit()
        print(f"✅ Subscription #{subscription_id} marked as performed for {year}")
    except Exception as e:
        db.rollback()
        print(f"❌ Failed to update subscription: {e}")
    finally:
        db.close()


# =============================================================================
# STANDALONE EXECUTION
# =============================================================================

if __name__ == "__main__":
    """
    Run the scheduler directly from command line:
    
    Usage:
        python scheduler.py           # Run daily check
        python scheduler.py --test    # Run with test data
    """
    
    if len(sys.argv) > 1 and sys.argv[1] == "--test":
        print("\n🧪 Running in TEST MODE with sample data...")
        print("   Mock Panchangam: Kartika Shukla Purnima")
    
    # Run the daily check
    result = check_todays_pujas()

    # Level 12: The Oracle Integration
    # Predictive Infrastructure Check
    try:
        from oracle_ops import check_forecast_and_scale
        print("\n\n" + "=" * 70)
        print("[ORACLE] PREDICTIVE INFRASTRUCTURE CHECK")
        print("=" * 70)
        check_forecast_and_scale()
    except Exception as e:
        print(f"Oracle Malfunction: {e}")
    
    # Optionally print JSON for integration
    if len(sys.argv) > 1 and sys.argv[1] == "--json":
        import json
        print("\n📄 JSON OUTPUT:")
        print(json.dumps(result, indent=2, default=str))
