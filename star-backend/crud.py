"""
S.T.A.R. Backend - CRUD Operations
===================================
Database operations for creating and managing records.
"""

from sqlalchemy.orm import Session
from sqlalchemy import text
from datetime import datetime
import random
import string

from schemas import TransactionCreate, ShaswataCreate, SubscriptionType


def generate_receipt_number() -> str:
    """
    Generate a unique receipt number in format: STR-YYYY-XXXXX
    Example: STR-2026-00042
    """
    year = datetime.now().year
    # Generate random 5-digit number (in production, use sequential from DB)
    random_num = ''.join(random.choices(string.digits, k=5))
    return f"STR-{year}-{random_num}"


def get_or_create_devotee(db: Session, name_en: str, phone: str, 
                          name_kn: str = None, gothra_en: str = None, gothra_kn: str = None,
                          nakshatra: str = None, rashi: str = None, address: str = None,
                          area: str = None, pincode: str = None) -> int:
    """
    Find an existing devotee by phone number, or create a new one.
    Supports bilingual names (English + Kannada).
    
    Args:
        db: Database session
        name_en: Devotee's full name in English
        name_kn: Devotee's full name in Kannada (optional)
        phone: Phone number (used as unique identifier)
        gothra_en: Gotra in English
        gothra_kn: Gotra in Kannada
        nakshatra: Birth star (stored in English)
        rashi: Zodiac sign (stored in English)
        address: Postal address
        
    Returns:
        devotee_id: The ID of the existing or newly created devotee
    """
    # Check if devotee exists by phone number
    result = db.execute(
        text("SELECT id FROM devotees WHERE phone_number = :phone"),
        {"phone": phone}
    ).fetchone()
    
    if result:
        # Devotee exists, update their info and return ID
        devotee_id = result[0]
        db.execute(
            text("""
                UPDATE devotees 
                SET full_name_en = :name_en, 
                    full_name_kn = COALESCE(:name_kn, full_name_kn),
                    gothra_en = COALESCE(:gothra_en, gothra_en),
                    gothra_kn = COALESCE(:gothra_kn, gothra_kn),
                    nakshatra = COALESCE(:nakshatra, nakshatra),
                    rashi = COALESCE(:rashi, rashi),
                    address = COALESCE(:address, address),
                    area = COALESCE(:area, area),
                    pincode = COALESCE(:pincode, pincode),
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = :id
            """),
            {"name_en": name_en, "name_kn": name_kn, "gothra_en": gothra_en, 
             "gothra_kn": gothra_kn, "nakshatra": nakshatra, "rashi": rashi, 
             "address": address, "area": area, "pincode": pincode, "id": devotee_id}
        )
        db.flush() # Keep transaction open
        return devotee_id
    else:
        # Create new devotee
        result = db.execute(
            text("""
                INSERT INTO devotees (full_name_en, full_name_kn, phone_number, gothra_en, gothra_kn, nakshatra, rashi, address, area, pincode)
                VALUES (:name_en, :name_kn, :phone, :gothra_en, :gothra_kn, :nakshatra, :rashi, :address, :area, :pincode)
                RETURNING id
            """),
            {"name_en": name_en, "name_kn": name_kn, "phone": phone, 
             "gothra_en": gothra_en, "gothra_kn": gothra_kn, "nakshatra": nakshatra, 
             "rashi": rashi, "address": address, "area": area, "pincode": pincode}
        )
        db.flush() # Keep transaction open
        new_id = result.fetchone()[0]
        return new_id


def create_transaction(db: Session, transaction: TransactionCreate, user_id: int = 1) -> dict:
    """
    Create a new seva booking/transaction.
    
    This function:
    1. Finds or creates the devotee based on phone number
    2. Creates a new transaction record
    3. Returns the transaction details with receipt number
    
    Args:
        db: Database session
        transaction: TransactionCreate schema with booking details
        user_id: ID of the staff member creating this transaction (default: 1 for admin)
        
    Returns:
        dict with transaction_id, receipt_no, and booking details
    """
    try:
        # Step 1: Get or create devotee (bilingual support)
        # Extract bilingual fields from transaction, with fallbacks
        name_en = getattr(transaction, 'devotee_name_en', None) or transaction.devotee_name
        name_kn = getattr(transaction, 'devotee_name_kn', None)
        gothra_en = getattr(transaction, 'gothra_en', None) or transaction.gothra
        gothra_kn = getattr(transaction, 'gothra_kn', None)
        
        devotee_id = get_or_create_devotee(
            db=db,
            name_en=name_en,
            phone=transaction.phone_number,
            name_kn=name_kn,
            gothra_en=gothra_en,
            gothra_kn=gothra_kn,
            nakshatra=transaction.nakshatra,
            rashi=transaction.rashi,
            area=transaction.area,
            pincode=transaction.pincode
        )
        
        # Step 2: Generate receipt number
        receipt_no = generate_receipt_number()
        
        # Step 3: Get seva name for the response
        seva_result = db.execute(
            text("SELECT name_eng FROM seva_catalog WHERE id = :seva_id"),
            {"seva_id": transaction.seva_id}
        ).fetchone()
        
        if not seva_result:
            raise ValueError(f"Seva with ID {transaction.seva_id} not found")
        
        seva_name = seva_result[0]
        
        # Step 4: Insert transaction
        result = db.execute(
            text("""
                INSERT INTO transactions 
                (receipt_no, devotee_id, seva_id, amount_paid, payment_mode, 
                 devotee_name, created_by_user_id, transaction_date, seva_date)
                VALUES 
                (:receipt_no, :devotee_id, :seva_id, :amount, CAST(:payment_mode AS payment_mode),
                 :devotee_name, :user_id, CURRENT_TIMESTAMP, :seva_date)
                RETURNING id
            """),
            {
                "receipt_no": receipt_no,
                "devotee_id": devotee_id,
                "seva_id": transaction.seva_id,
                "amount": transaction.amount,
                "payment_mode": transaction.payment_mode.value,
                "devotee_name": transaction.devotee_name,
                "user_id": user_id,
                "seva_date": transaction.seva_date or datetime.now().date()
            }
        )
        db.commit()
        
        transaction_id = result.fetchone()[0]
        
        return {
            "transaction_id": transaction_id,
            "receipt_no": receipt_no,
            "devotee_name": transaction.devotee_name,
            "seva_name": seva_name,
            "amount_paid": transaction.amount,
            "payment_mode": transaction.payment_mode.value,
            "message": f"Booking Successful! Receipt #{receipt_no}"
        }
        
    except Exception as e:
        db.rollback()
        raise e


def get_daily_transactions(db: Session, date: str = None) -> list:
    """
    Get all transactions for a specific date.
    
    Args:
        db: Database session
        date: Date string in YYYY-MM-DD format. Defaults to today.
        
    Returns:
        List of transactions for the specified date
    """
    if date is None:
        date = datetime.now().strftime("%Y-%m-%d")
    
    result = db.execute(
        text("""
            SELECT t.id, t.receipt_no, t.devotee_name, s.name_eng as seva_name,
                   t.amount_paid, t.payment_mode, t.transaction_date
            FROM transactions t
            JOIN seva_catalog s ON t.seva_id = s.id
            WHERE DATE(t.transaction_date) = :date
            ORDER BY t.transaction_date DESC
        """),
        {"date": date}
    ).fetchall()
    
    return [
        {
            "id": row[0],
            "receipt_no": row[1],
            "devotee_name": row[2],
            "seva_name": row[3],
            "amount_paid": float(row[4]),
            "payment_mode": row[5],
            "transaction_date": str(row[6])
        }
        for row in result
    ]


def get_devotee_by_phone(db: Session, phone: str) -> dict:
    """
    Get devotee details by phone number (bilingual).
    
    Args:
        db: Database session
        phone: Phone number to search
        
    Returns:
        Dict with devotee details (EN + KN) or None if not found
    """
    result = db.execute(
        text("""
            SELECT full_name_en, full_name_kn, gothra_en, gothra_kn, nakshatra, rashi 
            FROM devotees WHERE phone_number = :phone
        """),
        {"phone": phone}
    ).fetchone()

    if result:
        return {
            "full_name": result[0],      # Backward compat alias
            "full_name_en": result[0],
            "full_name_kn": result[1],
            "gothra": result[2],          # Backward compat alias
            "gothra_en": result[2],
            "gothra_kn": result[3],
            "nakshatra": result[4],
            "rashi": result[5]
        }
    return None


# =============================================================================
# SHASWATA (PERPETUAL PUJA) OPERATIONS
# =============================================================================

def create_shaswata_subscription(db: Session, subscription: ShaswataCreate, user_id: int = 1) -> dict:
    """
    Create a new Shaswata (Perpetual) Puja subscription.
    
    Supports three subscription types:
    - GREGORIAN: Fixed English calendar date (birthday/anniversary)
    - LUNAR: Hindu Panchanga date (Maasa + Paksha + Tithi)
    - RATHOTSAVA: Fixed annual festival (no date selection needed)
    
    Args:
        db: Database session
        subscription: ShaswataCreate schema with subscription details
        user_id: ID of the staff member creating this subscription
        
    Returns:
        dict with subscription_id and formatted date info
    """
    try:
        # Step 1: Get or create devotee
        # Step 1: Get or create devotee
        devotee_id = get_or_create_devotee(
            db=db,
            name_en=subscription.devotee_name,
            phone=subscription.phone_number,
            gothra_en=subscription.gothra,
            nakshatra=subscription.nakshatra,
            rashi=subscription.rashi,
            address=subscription.address,
            area=subscription.area,
            pincode=subscription.pincode
        )
        
        # Step 2: Get seva name (optional - may be null for quick subscriptions)
        seva_name = None
        if subscription.seva_id:
            seva_result = db.execute(
                text("SELECT name_eng FROM seva_catalog WHERE id = :seva_id"),
                {"seva_id": subscription.seva_id}
            ).fetchone()
            if seva_result:
                seva_name = seva_result[0]
        
        # Step 3: Prepare date fields based on subscription type
        event_day = None
        event_month = None
        maasa = None
        paksha = None
        tithi = None
        
        sub_type = subscription.subscription_type.value if hasattr(subscription.subscription_type, 'value') else str(subscription.subscription_type)
        
        if sub_type == 'GREGORIAN':
            event_day = subscription.event_day
            event_month = subscription.event_month
        elif sub_type == 'LUNAR':
            maasa = subscription.maasa.value if hasattr(subscription.maasa, 'value') else subscription.maasa
            paksha = subscription.paksha.value if hasattr(subscription.paksha, 'value') else subscription.paksha
            tithi = subscription.tithi.value if hasattr(subscription.tithi, 'value') else subscription.tithi
        # RATHOTSAVA type: no date fields needed
        
        # Step 4: Insert shaswata subscription
        seva_type = getattr(subscription, 'seva_type', 'GENERAL') or 'GENERAL'
        
        result = db.execute(
            text("""
                INSERT INTO shaswata_subscriptions 
                (devotee_id, seva_id, subscription_type, seva_type,
                 event_day, event_month, 
                 maasa, paksha, tithi, 
                 occasion, notes, is_active)
                VALUES 
                (:devotee_id, :seva_id, :sub_type, :seva_type,
                 :event_day, :event_month,
                 :maasa, :paksha, :tithi,
                 :occasion, :notes, TRUE)
                RETURNING id
            """),
            {
                "devotee_id": devotee_id,
                "seva_id": subscription.seva_id,
                "sub_type": sub_type,
                "seva_type": seva_type,
                "event_day": event_day,
                "event_month": event_month,
                "maasa": maasa,
                "paksha": paksha,
                "tithi": tithi,
                "occasion": getattr(subscription, 'occasion', None),
                "notes": subscription.notes
            }
        )
        
        subscription_id = result.fetchone()[0]
        
        # Step 5: Create transaction for payment (if amount provided)
        if subscription.amount and subscription.payment_mode:
            receipt_no = generate_receipt_number()
            db.execute(
                text("""
                    INSERT INTO transactions 
                    (receipt_no, devotee_id, seva_id, amount_paid, payment_mode, 
                     devotee_name, created_by_user_id, transaction_date, notes)
                    VALUES 
                    (:receipt_no, :devotee_id, :seva_id, :amount, CAST(:payment_mode AS payment_mode),
                     :devotee_name, :user_id, CURRENT_TIMESTAMP, :notes)
                """),
                {
                    "receipt_no": receipt_no,
                    "devotee_id": devotee_id,
                    "seva_id": subscription.seva_id,
                    "amount": subscription.amount,
                    "payment_mode": subscription.payment_mode.value if hasattr(subscription.payment_mode, 'value') else subscription.payment_mode,
                    "devotee_name": subscription.devotee_name,
                    "user_id": user_id,
                    "notes": f"Shaswata Subscription #{subscription_id} ({seva_type})"
                }
            )
        
        db.commit()
        
        # Step 6: Format response
        lunar_date = None
        gregorian_date = None
        
        if sub_type == 'LUNAR' and maasa:
            lunar_date = f"{maasa} {paksha} {tithi}"
        elif sub_type == 'GREGORIAN' and event_month:
            month_names = ["", "January", "February", "March", "April", "May", "June",
                          "July", "August", "September", "October", "November", "December"]
            gregorian_date = f"{month_names[event_month]} {event_day}"
        elif sub_type == 'RATHOTSAVA':
            gregorian_date = "Rathotsava (Annual Festival)"
        
        return {
            "subscription_id": subscription_id,
            "devotee_name": subscription.devotee_name,
            "seva_name": seva_name or "Shaswata Seva",
            "subscription_type": sub_type,
            "seva_type": seva_type,
            "lunar_date": lunar_date,
            "gregorian_date": gregorian_date,
            "is_active": True,
            "message": f"Shaswata Subscription Created! ID #{subscription_id}"
        }
        
    except Exception as e:
        db.rollback()
        raise e


def get_shaswata_subscriptions(db: Session, active_only: bool = True) -> list:
    """
    Get all Shaswata subscriptions with devotee and seva details.
    
    Args:
        db: Database session
        active_only: If True, only return active subscriptions
        
    Returns:
        List of subscription records
    """
    query = """
        SELECT 
            ss.id, d.full_name_en, d.phone_number, d.gothra_en,
            COALESCE(sc.name_eng, 'Shaswata Seva') as seva_name,
            ss.subscription_type, ss.seva_type, ss.maasa, ss.paksha, ss.tithi,
            ss.event_day, ss.event_month,
            ss.last_performed_year, ss.notes, ss.is_active
        FROM shaswata_subscriptions ss
        JOIN devotees d ON ss.devotee_id = d.id
        LEFT JOIN seva_catalog sc ON ss.seva_id = sc.id
    """
    
    if active_only:
        query += " WHERE ss.is_active = TRUE"
    
    query += " ORDER BY ss.created_at DESC"
    
    result = db.execute(text(query)).fetchall()
    
    subscriptions = []
    for row in result:
        sub_type = row[5]
        
        sub = {
            "id": row[0],
            "devotee_name": row[1],
            "phone_number": row[2],
            "gothra": row[3],
            "seva_name": row[4],
            "subscription_type": sub_type,
            "seva_type": row[6] or "GENERAL",
            "is_active": row[14]
        }
        
        if sub_type == "LUNAR":
            sub["lunar_date"] = f"{row[7]} {row[8]} {row[9]}" if row[7] else None
            sub["gregorian_date"] = None
        elif sub_type == "GREGORIAN":
            month_names = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun",
                          "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
            sub["gregorian_date"] = f"{month_names[row[11]]} {row[10]}" if row[10] else None
            sub["lunar_date"] = None
        elif sub_type == "RATHOTSAVA":
            sub["gregorian_date"] = "Rathotsava (Annual)"
            sub["lunar_date"] = None
        
        sub["last_performed_year"] = row[12]
        sub["notes"] = row[13]
        subscriptions.append(sub)
    
    return subscriptions


# =============================================================================
# DISPATCH & FEEDBACK AUTOMATION (Stage 2)
# =============================================================================

def log_dispatch(db: Session, subscription_id: int) -> dict:
    """
    Mark subscription as dispatched (today's date).
    Following DB Integrity: ACID transaction wrapping.
    """
    try:
        result = db.execute(
            text("""
                UPDATE shaswata_subscriptions 
                SET last_dispatch_date = CURRENT_DATE,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = :sub_id
                RETURNING id, last_dispatch_date
            """),
            {"sub_id": subscription_id}
        )
        row = result.fetchone()
        if not row:
            raise ValueError(f"Subscription {subscription_id} not found")
        
        db.commit()
        return {
            "subscription_id": row[0],
            "dispatch_date": str(row[1]),
            "message": "Dispatch logged successfully"
        }
    except Exception as e:
        db.rollback()
        raise e


def log_feedback_sent(db: Session, subscription_id: int) -> dict:
    """
    Mark feedback as sent (today's date).
    Following DB Integrity: ACID transaction wrapping.
    """
    try:
        result = db.execute(
            text("""
                UPDATE shaswata_subscriptions 
                SET last_feedback_date = CURRENT_DATE,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = :sub_id
                RETURNING id, last_feedback_date
            """),
            {"sub_id": subscription_id}
        )
        row = result.fetchone()
        if not row:
            raise ValueError(f"Subscription {subscription_id} not found")
        
        db.commit()
        return {
            "subscription_id": row[0],
            "feedback_date": str(row[1]),
            "message": "Feedback logged successfully"
        }
    except Exception as e:
        db.rollback()
        raise e


def get_pending_feedback_subscriptions(db: Session) -> list:
    """
    Get subscriptions where:
    1. dispatch_date + 5 days <= today
    2. feedback not sent this year (or never sent)
    
    Following DB Integrity: N+1 Prevention with JOIN.
    """
    query = text("""
        SELECT 
            ss.id, d.full_name_en, d.phone_number, d.gothra_en,
            COALESCE(sc.name_eng, 'Shaswata Seva') as seva_name,
            ss.last_dispatch_date, ss.last_feedback_date
        FROM shaswata_subscriptions ss
        JOIN devotees d ON ss.devotee_id = d.id
        LEFT JOIN seva_catalog sc ON ss.seva_id = sc.id
        WHERE ss.is_active = TRUE
          AND ss.last_dispatch_date IS NOT NULL
          AND ss.last_dispatch_date <= CURRENT_DATE - INTERVAL '5 days'
          AND (ss.last_feedback_date IS NULL 
               OR EXTRACT(YEAR FROM ss.last_feedback_date) < EXTRACT(YEAR FROM CURRENT_DATE))
        ORDER BY ss.last_dispatch_date ASC
    """)
    
    result = db.execute(query).fetchall()
    
    return [{
        "id": row[0],
        "devotee_name": row[1],
        "phone": row[2],
        "gothra": row[3],
        "seva_name": row[4],
        "dispatch_date": str(row[5]) if row[5] else None,
        "last_feedback_date": str(row[6]) if row[6] else None
    } for row in result]

def get_financial_report(db: Session, start_date: str, end_date: str) -> dict:
    """
    Aggregate financial data for reports within a date range.
    """
    # Get Financial Totals (Cash vs UPI)
    financials_query = text("""
        SELECT 
            COALESCE(SUM(amount_paid), 0) as total,
            COALESCE(SUM(CASE WHEN payment_mode = 'CASH' THEN amount_paid ELSE 0 END), 0) as cash,
            COALESCE(SUM(CASE WHEN payment_mode = 'UPI' THEN amount_paid ELSE 0 END), 0) as upi
        FROM transactions
        WHERE CAST(transaction_date AS DATE) >= CAST(:start_date AS DATE) 
          AND CAST(transaction_date AS DATE) <= CAST(:end_date AS DATE)
    """)
    
    # Get Seva-wise Performance
    seva_query = text("""
        SELECT 
            s.name_eng as seva_name,
            COUNT(t.id) as count,
            COALESCE(SUM(t.amount_paid), 0) as revenue
        FROM transactions t
        JOIN seva_catalog s ON t.seva_id = s.id
        WHERE CAST(t.transaction_date AS DATE) >= CAST(:start_date AS DATE) 
          AND CAST(t.transaction_date AS DATE) <= CAST(:end_date AS DATE)
        GROUP BY s.name_eng
        ORDER BY revenue DESC
    """)
    
    try:
        financials_result = db.execute(financials_query, {"start_date": start_date, "end_date": end_date}).fetchone()
        # Fallback for empty results
        total = float(financials_result[0] or 0)
        cash = float(financials_result[1] or 0)
        upi = float(financials_result[2] or 0)

        seva_results = db.execute(seva_query, {"start_date": start_date, "end_date": end_date}).fetchall()
        
        return {
            "financials": {
                "total": total,
                "cash": cash,
                "upi": upi
            },
            "seva_stats": [
                {"name": row[0], "count": row[1], "revenue": float(row[2] or 0)}
                for row in seva_results
            ]
        }
    except Exception as e:
        print(f"Aggregation Error: {e}")
        import traceback
        traceback.print_exc()
        return {
            "financials": {"total": 0, "cash": 0, "upi": 0},
            "seva_stats": []
        }

