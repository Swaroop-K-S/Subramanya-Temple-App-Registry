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

try:
    from .schemas import (
        TransactionCreate, ShaswataCreate, SubscriptionType, 
        SevaUpdate, SevaCreate, UserCreate
    )
except ImportError as e:
    print(f"DEBUG ERROR in crud.py: {e}")
    import app.schemas
    print(f"DEBUG: app.schemas path: {app.schemas.__file__}")
    print(f"DEBUG: dir(app.schemas): {dir(app.schemas)}")
    raise e
from .models import SevaCatalog, User, Transaction, Devotee, ShaswataSubscription

# =============================================================================
# USER MANAGEMENT (AUTH)
# =============================================================================

def get_user_by_username(db: Session, username: str):
    """Get a user by username"""
    return db.query(User).filter(User.username == username).first()

def create_user(db: Session, user: UserCreate):
    """Create a new user (with pre-hashed password from service)"""
    db_user = User(
        username=user.username,
        hashed_password=user.password, # Service layer handles hashing
        role=user.role
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user




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
    ).scalar()
    
    if result:
        # Devotee exists, update their info and return ID
        devotee_id = result
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
        ).close()
        db.commit()
        return devotee_id
    else:
        # Create new devotee
        result = db.execute(
            text("""
                INSERT INTO devotees (full_name_en, full_name_kn, phone_number, gothra_en, gothra_kn, nakshatra, rashi, address, area, pincode)
                VALUES (:name_en, :name_kn, :phone, :gothra_en, :gothra_kn, :nakshatra, :rashi, :address, :area, :pincode)
            """),
            {"name_en": name_en, "name_kn": name_kn, "phone": phone, 
             "gothra_en": gothra_en, "gothra_kn": gothra_kn, "nakshatra": nakshatra, 
             "rashi": rashi, "address": address, "area": area, "pincode": pincode}
        )
        new_id = result.lastrowid
        db.commit()
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
        seva_name = db.execute(
            text("SELECT name_eng FROM seva_catalog WHERE id = :seva_id"),
            {"seva_id": transaction.seva_id}
        ).scalar()
        
        if not seva_name:
            raise ValueError(f"Seva with ID {transaction.seva_id} not found")
        
        # Step 4: Insert transaction
        result = db.execute(
            text("""
                INSERT INTO transactions 
                (receipt_no, devotee_id, seva_id, amount_paid, payment_mode, 
                 devotee_name, created_by_user_id, transaction_date, seva_date)
                VALUES 
                (:receipt_no, :devotee_id, :seva_id, :amount_paid, :payment_mode,
                 :devotee_name, :user_id, CURRENT_TIMESTAMP, :seva_date)
            """),
            {
                "receipt_no": receipt_no,
                "devotee_id": devotee_id,
                "seva_id": transaction.seva_id,
                "amount_paid": transaction.amount,
                "payment_mode": transaction.payment_mode.value,
                "devotee_name": transaction.devotee_name,
                "user_id": user_id,
                "seva_date": transaction.seva_date or datetime.now().date()
            }
        )
        transaction_id = result.lastrowid
        db.commit()
        
        return {
            "transaction_id": transaction_id,
            "receipt_no": receipt_no,
            "devotee_name": transaction.devotee_name,
            "seva_name": seva_name,
            "amount_paid": transaction.amount,
            "payment_mode": transaction.payment_mode.value,
            "message": f"Booking Successful! Receipt #{receipt_no}",
            "nakshatra": transaction.nakshatra,
            "rashi": transaction.rashi,
            "gothra": transaction.gothra,
            "gothra_en": gothra_en,
            "gothra_kn": gothra_kn,
            "seva_date": transaction.seva_date
        }
        
    except Exception as e:
        db.rollback()
        raise e


def get_daily_transactions(db: Session, date: str = None, 
                           payment_mode: str = None, seva_id: int = None,
                           skip: int = 0, limit: int = 200,
                           sort_by: str = "time_desc", lang: str = "en") -> dict:
    """
    Get paginated, filterable transactions for a specific date.
    
    Args:
        db: Database session
        date: Date string in YYYY-MM-DD format. Defaults to today.
        payment_mode: Filter by 'CASH' or 'UPI' (optional)
        seva_id: Filter by specific seva ID (optional)
        skip: Number of records to skip (pagination offset)
        limit: Max records to return (default 200)
        sort_by: Sort order - 'time_desc', 'time_asc', 'amount_desc', 'amount_asc', 'name_asc'
        
    Returns:
        Dict with 'transactions' list, 'total' count, 'page_info'
    """
    if date is None:
        date = datetime.now().strftime("%Y-%m-%d")
    
    # Build dynamic WHERE clause
    where_clauses = ["DATE(t.transaction_date) = :date", "t.is_active = true"]
    params = {"date": date}
    
    if payment_mode:
        where_clauses.append("t.payment_mode = :payment_mode")
        params["payment_mode"] = payment_mode.upper()
    
    if seva_id:
        where_clauses.append("t.seva_id = :seva_id")
        params["seva_id"] = seva_id
    
    where_sql = " AND ".join(where_clauses)
    
    # Sort mapping
    sort_map = {
        "time_desc": "t.transaction_date DESC",
        "time_asc": "t.transaction_date ASC",
        "amount_desc": "t.amount_paid DESC",
        "amount_asc": "t.amount_paid ASC",
        "name_asc": "t.devotee_name ASC",
    }
    order_sql = sort_map.get(sort_by, "t.transaction_date DESC")
    
    # Count total (for pagination info)
    count_result = db.execute(
        text(f"SELECT COUNT(*) FROM transactions t WHERE {where_sql}"),
        params
    ).scalar()
    
    # Fetch paginated data (Phase 2: join users for staff info, devotee for gothra/nakshatra)
    # Select localized seva name
    seva_name_col = "s.name_kan" if lang == "kn" else "s.name_eng"
    
    query = f"""
        SELECT t.id, t.receipt_no, t.devotee_name, COALESCE({seva_name_col}, s.name_eng) as seva_name,
               t.amount_paid, t.payment_mode, t.transaction_date, t.seva_id,
               t.notes,
               d.phone_number, d.gothra_en, d.nakshatra, d.rashi,
               u.username as booked_by, u.role as booked_by_role
        FROM transactions t
        JOIN seva_catalog s ON t.seva_id = s.id
        LEFT JOIN devotees d ON t.devotee_id = d.id
        LEFT JOIN users u ON t.created_by_user_id = u.id
        WHERE {where_sql}
        ORDER BY {order_sql}
        LIMIT :limit OFFSET :skip
    """
    params["limit"] = limit
    params["skip"] = skip
    
    result = db.execute(text(query), params)
    keys = result.keys()
    transactions = [dict(zip(keys, row)) for row in result.fetchall()]
    
    return {
        "transactions": transactions,
        "total": count_result,
        "page": (skip // limit) + 1,
        "pages": max(1, -(-count_result // limit)),  # ceil division
        "has_more": (skip + limit) < count_result
    }


def get_daily_stats(db: Session, date: str = None, lang: str = "en") -> dict:
    """
    Get aggregate statistics for a specific date — computed in the DB for zero-cost.
    
    Returns:
        Dict with total_amount, cash_total, upi_total, booking_count, 
        seva_breakdown (list of seva-wise totals), and hourly_trend.
    """
    if date is None:
        date = datetime.now().strftime("%Y-%m-%d")
    
    # Aggregate totals
    agg = db.execute(
        text("""
            SELECT 
                COUNT(*) as booking_count,
                COALESCE(SUM(amount_paid), 0) as total_amount,
                COALESCE(SUM(CASE WHEN payment_mode = 'CASH' THEN amount_paid ELSE 0 END), 0) as cash_total,
                COALESCE(SUM(CASE WHEN payment_mode = 'UPI' THEN amount_paid ELSE 0 END), 0) as upi_total
            FROM transactions
            WHERE DATE(transaction_date) = :date AND is_active = true
        """),
        {"date": date}
    ).fetchone()
    
    # Seva-wise breakdown
    seva_name_col = "s.name_kan" if lang == "kn" else "s.name_eng"
    
    seva_rows = db.execute(
        text(f"""
            SELECT COALESCE({seva_name_col}, s.name_eng) as seva_name, s.id as seva_id, 
                   COUNT(*) as count, SUM(t.amount_paid) as total
            FROM transactions t
            JOIN seva_catalog s ON t.seva_id = s.id
            WHERE DATE(t.transaction_date) = :date AND t.is_active = true
            GROUP BY s.id, s.name_eng
            ORDER BY total DESC
        """),
        {"date": date}
    )
    seva_keys = seva_rows.keys()
    seva_breakdown = [dict(zip(seva_keys, row)) for row in seva_rows.fetchall()]
    
    # Hourly trend (for chart)
    from .database import is_postgres
    if is_postgres():
        hourly_sql = """
            SELECT EXTRACT(HOUR FROM transaction_date)::INTEGER as hour, 
                   COUNT(*) as count,
                   SUM(amount_paid) as total
            FROM transactions
            WHERE DATE(transaction_date) = :date
            GROUP BY EXTRACT(HOUR FROM transaction_date)
            ORDER BY hour ASC
        """
    else:
        hourly_sql = """
            SELECT CAST(strftime('%H', transaction_date) AS INTEGER) as hour,
                   COUNT(*) as count,
                   SUM(amount_paid) as total
            FROM transactions
            WHERE DATE(transaction_date) = :date
            GROUP BY strftime('%H', transaction_date)
            ORDER BY hour ASC
        """
    hourly_rows = db.execute(text(hourly_sql), {"date": date})
    hourly_keys = hourly_rows.keys()
    hourly_trend = [dict(zip(hourly_keys, row)) for row in hourly_rows.fetchall()]
    
    return {
        "date": date,
        "booking_count": agg[0],
        "total_amount": float(agg[1]),
        "cash_total": float(agg[2]),
        "upi_total": float(agg[3]),
        "seva_breakdown": seva_breakdown,
        "hourly_trend": hourly_trend
    }


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
        
        subscription_id = result.lastrowid
        
        # Step 5: Create transaction for payment (if amount provided)
        if subscription.amount and subscription.payment_mode:
            receipt_no = generate_receipt_number()
            db.execute(
                text("""
                    INSERT INTO transactions 
                    (receipt_no, devotee_id, seva_id, amount_paid, payment_mode, 
                     devotee_name, created_by_user_id, transaction_date, notes)
                    VALUES 
                    (:receipt_no, :devotee_id, :seva_id, :amount, :payment_mode,
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
            ss.last_performed_year, ss.notes, ss.is_active,
            d.address
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
            "is_active": row[14],
            "address": row[15]  # NEW: Include address
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
        # Check if subscription exists first
        exists = db.execute(
            text("SELECT id FROM shaswata_subscriptions WHERE id = :sub_id"),
            {"sub_id": subscription_id}
        ).fetchone()
        if not exists:
            raise ValueError(f"Subscription {subscription_id} not found")
        
        # Update (SQLite-compatible — no RETURNING clause)
        db.execute(
            text("""
                UPDATE shaswata_subscriptions 
                SET last_dispatch_date = CURRENT_DATE,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = :sub_id
            """),
            {"sub_id": subscription_id}
        )
        
        # Fetch updated values
        row = db.execute(
            text("SELECT id, last_dispatch_date FROM shaswata_subscriptions WHERE id = :sub_id"),
            {"sub_id": subscription_id}
        ).fetchone()
        
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
        # Check if subscription exists first
        exists = db.execute(
            text("SELECT id FROM shaswata_subscriptions WHERE id = :sub_id"),
            {"sub_id": subscription_id}
        ).fetchone()
        if not exists:
            raise ValueError(f"Subscription {subscription_id} not found")
        
        # Update (SQLite-compatible — no RETURNING clause)
        db.execute(
            text("""
                UPDATE shaswata_subscriptions 
                SET last_feedback_date = CURRENT_DATE,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = :sub_id
            """),
            {"sub_id": subscription_id}
        )
        
        # Fetch updated values
        row = db.execute(
            text("SELECT id, last_feedback_date FROM shaswata_subscriptions WHERE id = :sub_id"),
            {"sub_id": subscription_id}
        ).fetchone()
        
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
    from .database import is_postgres
    if is_postgres():
        query = text("""
            SELECT 
                ss.id, d.full_name_en, d.phone_number, d.gothra_en,
                COALESCE(sc.name_eng, 'Shaswata Seva') as seva_name,
                ss.last_dispatch_date, ss.last_feedback_date
            FROM shaswata_subscriptions ss
            JOIN devotees d ON ss.devotee_id = d.id
            LEFT JOIN seva_catalog sc ON ss.seva_id = sc.id
            WHERE ss.is_active = true
              AND ss.last_dispatch_date IS NOT NULL
              AND (ss.last_dispatch_date + INTERVAL '5 days') <= CURRENT_DATE
              AND (ss.last_feedback_date IS NULL 
                   OR EXTRACT(YEAR FROM ss.last_feedback_date) < EXTRACT(YEAR FROM CURRENT_DATE))
            ORDER BY ss.last_dispatch_date ASC
        """)
    else:
        query = text("""
            SELECT 
                ss.id, d.full_name_en, d.phone_number, d.gothra_en,
                COALESCE(sc.name_eng, 'Shaswata Seva') as seva_name,
                ss.last_dispatch_date, ss.last_feedback_date
            FROM shaswata_subscriptions ss
            JOIN devotees d ON ss.devotee_id = d.id
            LEFT JOIN seva_catalog sc ON ss.seva_id = sc.id
            WHERE ss.is_active = 1
              AND ss.last_dispatch_date IS NOT NULL
              AND DATE(ss.last_dispatch_date, '+5 days') <= DATE('now')
              AND (ss.last_feedback_date IS NULL 
                   OR CAST(strftime('%Y', ss.last_feedback_date) AS INTEGER) < CAST(strftime('%Y', 'now') AS INTEGER))
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
        WHERE DATE(transaction_date) >= DATE(:start_date) 
          AND DATE(transaction_date) <= DATE(:end_date)
    """)
    
    # Get Seva-wise Performance
    seva_query = text("""
        SELECT 
            s.name_eng as seva_name,
            COUNT(t.id) as count,
            COALESCE(SUM(t.amount_paid), 0) as revenue
        FROM transactions t
        JOIN seva_catalog s ON t.seva_id = s.id
        WHERE DATE(t.transaction_date) >= DATE(:start_date) 
          AND DATE(t.transaction_date) <= DATE(:end_date)
        GROUP BY s.name_eng
        ORDER BY revenue DESC
    """)
    
    # Get Daily Trends (For Area Chart)
    trends_query = text("""
        SELECT 
            DATE(transaction_date) as date,
            COALESCE(SUM(amount_paid), 0) as revenue,
            COUNT(id) as count
        FROM transactions
        WHERE DATE(transaction_date) >= DATE(:start_date) 
          AND DATE(transaction_date) <= DATE(:end_date)
        GROUP BY DATE(transaction_date)
        ORDER BY date ASC
    """)
    
    try:
        financials_result = db.execute(financials_query, {"start_date": start_date, "end_date": end_date}).fetchone()
        # Fallback for empty results
        total = float(financials_result[0] or 0)
        cash = float(financials_result[1] or 0)
        upi = float(financials_result[2] or 0)

        seva_results = db.execute(seva_query, {"start_date": start_date, "end_date": end_date}).fetchall()
        trends_results = db.execute(trends_query, {"start_date": start_date, "end_date": end_date}).fetchall()
        
        return {
            "financials": {
                "total": total,
                "cash": cash,
                "upi": upi
            },
            "seva_stats": [
                {"name": row[0], "count": row[1], "revenue": float(row[2] or 0)}
                for row in seva_results
            ],
            "daily_trends": [
                {"date": str(row[0]), "revenue": float(row[1] or 0), "count": int(row[2])}
                for row in trends_results
            ]
        }
    except Exception as e:
        print(f"Aggregation Error: {e}")
        import traceback
        traceback.print_exc()
        return {
            "financials": {"total": 0, "cash": 0, "upi": 0},
            "seva_stats": [],
            "daily_trends": []
        }


def get_enhanced_report(db: Session, start_date: str, end_date: str) -> dict:
    """
    Enhanced financial report with comparison period, hourly heatmap,
    average transaction value, and category breakdown.
    """
    from datetime import datetime as dt, timedelta

    # --- 1. Parse dates and compute previous period ---
    try:
        s = dt.strptime(start_date, "%Y-%m-%d")
        e = dt.strptime(end_date, "%Y-%m-%d")
    except ValueError:
        s = dt.now().replace(day=1)
        e = dt.now()
    
    period_days = (e - s).days + 1
    prev_end = s - timedelta(days=1)
    prev_start = prev_end - timedelta(days=period_days - 1)
    prev_start_str = prev_start.strftime("%Y-%m-%d")
    prev_end_str = prev_end.strftime("%Y-%m-%d")

    # --- 2. Current period financials ---
    fin_query = text("""
        SELECT 
            COALESCE(SUM(amount_paid), 0) as total,
            COALESCE(SUM(CASE WHEN payment_mode = 'CASH' THEN amount_paid ELSE 0 END), 0) as cash,
            COALESCE(SUM(CASE WHEN payment_mode = 'UPI' THEN amount_paid ELSE 0 END), 0) as upi,
            COUNT(*) as tx_count
        FROM transactions
        WHERE DATE(transaction_date) >= DATE(:start) 
          AND DATE(transaction_date) <= DATE(:end)
    """)
    cur = db.execute(fin_query, {"start": start_date, "end": end_date}).fetchone()
    total = float(cur[0] or 0)
    cash = float(cur[1] or 0)
    upi = float(cur[2] or 0)
    tx_count = int(cur[3] or 0)
    atv = round(total / tx_count, 2) if tx_count > 0 else 0

    # --- 3. Previous period financials (for comparison) ---
    prev = db.execute(fin_query, {"start": prev_start_str, "end": prev_end_str}).fetchone()
    prev_total = float(prev[0] or 0)
    prev_count = int(prev[3] or 0)
    prev_atv = round(prev_total / prev_count, 2) if prev_count > 0 else 0

    def pct_change(cur_val, prev_val):
        if prev_val == 0:
            return 100.0 if cur_val > 0 else 0.0
        return round(((cur_val - prev_val) / prev_val) * 100, 1)

    # --- 4. Seva-wise breakdown ---
    seva_rows = db.execute(text("""
        SELECT s.name_eng, COUNT(t.id), COALESCE(SUM(t.amount_paid), 0)
        FROM transactions t
        JOIN seva_catalog s ON t.seva_id = s.id
        WHERE DATE(t.transaction_date) >= DATE(:start) 
          AND DATE(t.transaction_date) <= DATE(:end)
        GROUP BY s.name_eng
        ORDER BY SUM(t.amount_paid) DESC
    """), {"start": start_date, "end": end_date}).fetchall()

    # --- 5. Daily trends ---
    trend_rows = db.execute(text("""
        SELECT DATE(transaction_date) as d,
               COALESCE(SUM(amount_paid), 0), COUNT(*)
        FROM transactions
        WHERE DATE(transaction_date) >= DATE(:start) 
          AND DATE(transaction_date) <= DATE(:end)
        GROUP BY DATE(transaction_date)
        ORDER BY d ASC
    """), {"start": start_date, "end": end_date}).fetchall()

    from .database import is_postgres
    if is_postgres():
        hourly_sql = """
            SELECT EXTRACT(HOUR FROM transaction_date)::INTEGER as hour,
                   COUNT(*) as bookings,
                   COALESCE(SUM(amount_paid), 0) as revenue
            FROM transactions
            WHERE DATE(transaction_date) >= DATE(:start)
              AND DATE(transaction_date) <= DATE(:end)
            GROUP BY hour
            ORDER BY hour
        """
    else:
        hourly_sql = """
            SELECT CAST(strftime('%H', transaction_date) AS INTEGER) as hour,
                   COUNT(*) as bookings,
                   COALESCE(SUM(amount_paid), 0) as revenue
            FROM transactions
            WHERE DATE(transaction_date) >= DATE(:start)
              AND DATE(transaction_date) <= DATE(:end)
            GROUP BY hour
            ORDER BY hour
        """
    hourly_rows = db.execute(text(hourly_sql), {"start": start_date, "end": end_date}).fetchall()

    # Build full 24-hour array (0-23)
    hourly_map = {int(r[0]): {"bookings": int(r[1]), "revenue": float(r[2])} for r in hourly_rows}
    hourly_heatmap = [
        {"hour": h, "bookings": hourly_map.get(h, {}).get("bookings", 0),
         "revenue": hourly_map.get(h, {}).get("revenue", 0)}
        for h in range(24)
    ]

    # --- 7. Shaswata vs Daily count ---
    shaswata_row = db.execute(text("""
        SELECT COUNT(*) FROM shaswata_subscriptions
        WHERE is_active = true
    """)).fetchone()
    shaswata_active = int(shaswata_row[0]) if shaswata_row else 0

    return {
        "financials": {
            "total": total, "cash": cash, "upi": upi,
            "tx_count": tx_count, "atv": atv,
            "cash_pct": round((cash / total * 100), 1) if total > 0 else 0,
            "upi_pct": round((upi / total * 100), 1) if total > 0 else 0,
        },
        "comparison": {
            "prev_total": prev_total,
            "prev_count": prev_count,
            "prev_atv": prev_atv,
            "total_change": pct_change(total, prev_total),
            "count_change": pct_change(tx_count, prev_count),
            "atv_change": pct_change(atv, prev_atv),
        },
        "seva_stats": [
            {"name": r[0], "count": int(r[1]), "revenue": float(r[2])}
            for r in seva_rows
        ],
        "daily_trends": [
            {"date": str(r[0]), "revenue": float(r[1]), "count": int(r[2])}
            for r in trend_rows
        ],
        "hourly_heatmap": hourly_heatmap,
        "shaswata_active": shaswata_active,
    }


def get_collection_details(db: Session, start_date: str, end_date: str) -> list:
    """
    Get line-item transaction details for a period (for PDF/Excel exports and drill-down).
    """
    rows = db.execute(text("""
        SELECT t.receipt_no, t.devotee_name, s.name_eng as seva_name,
               t.amount_paid, t.payment_mode, t.transaction_date, t.notes
        FROM transactions t
        JOIN seva_catalog s ON t.seva_id = s.id
        WHERE DATE(t.transaction_date) >= DATE(:start)
          AND DATE(t.transaction_date) <= DATE(:end)
        ORDER BY t.transaction_date ASC
    """), {"start": start_date, "end": end_date}).fetchall()
    
    return [
        {
            "receipt_no": r[0], "devotee_name": r[1], "seva_name": r[2],
            "amount": float(r[3] or 0), "payment_mode": r[4],
            "time": str(r[5]), "notes": r[6] or ""
        }
        for r in rows
    ]





def create_seva_fn(db: Session, seva_create: SevaCreate) -> SevaCatalog:
    """
    Create a new Seva.
    
    Args:
        db: Database session
        seva_create: Seva creation schema
        
    Returns:
        Created SevaCatalog object
    """
    db_seva = SevaCatalog(
        name_eng=seva_create.name_eng,
        name_kan=seva_create.name_kan,
        price=seva_create.price,
        is_shaswata=seva_create.is_shaswata,
        is_slot_based=seva_create.is_slot_based,
        daily_limit=seva_create.daily_limit,
        is_active=seva_create.is_active
    )
    db.add(db_seva)
    db.commit()
    db.refresh(db_seva)
    return db_seva


def get_all_sevas(db: Session, skip: int = 0, limit: int = 100):
    """Get all Sevas"""
    return db.query(SevaCatalog).offset(skip).limit(limit).all()



def update_seva(db: Session, seva_id: int, seva_update: SevaUpdate) -> SevaCatalog:
    """
    Update a Seva's details (Price, Active Status, Daily Limit).
    
    Args:
        db: Database session
        seva_id: ID of the seva to update
        seva_update: Pydantic model with update fields
        
    Returns:
        Updated SevaCatalog object
    """
    seva = db.query(SevaCatalog).filter(SevaCatalog.id == seva_id).first()
    
    if not seva:
        return None
        
    # Update fields if provided
    if seva_update.price is not None:
        seva.price = seva_update.price
        
    if seva_update.is_active is not None:
        seva.is_active = seva_update.is_active
        
    if seva_update.daily_limit is not None:
        # If 0 is passed, treat as unlimited (None)
        seva.daily_limit = seva_update.daily_limit if seva_update.daily_limit > 0 else None
    
    # updated_at is handled by database ON UPDATE
    
    db.commit()
    db.refresh(seva)
    return seva



# =============================================================================
# ALIASES & RE-EXPORTS (For Compatibility with Main.py)
# =============================================================================

# Alias create_transaction to book_seva_transaction
book_seva_transaction = create_transaction

# Alias get_daily_transactions to get_today_transactions
get_today_transactions = get_daily_transactions


def delete_seva(db: Session, seva_id: int):
    """
    Soft delete a Seva (set is_active=False).
    """
    return update_seva(db, seva_id, SevaUpdate(is_active=False))


def restore_seva(db: Session, seva_id: int):
    """
    Restore a soft-deleted Seva (set is_active=True).
    """
    return update_seva(db, seva_id, SevaUpdate(is_active=True))


def permanently_delete_seva(db: Session, seva_id: int):
    """
    Hard delete a Seva from the database permanently.
    Only works on inactive (soft-deleted) sevas for safety.
    """
    seva = db.query(SevaCatalog).filter(SevaCatalog.id == seva_id).first()
    if not seva:
        return None
    if seva.is_active:
        raise ValueError("Cannot permanently delete an active Seva. Soft-delete it first.")
    db.delete(seva)
    db.commit()
    return True


def permanently_delete_all_inactive_sevas(db: Session):
    """
    Hard delete ALL inactive sevas from the database (empty recycle bin).
    Returns the count of deleted items.
    """
    count = db.query(SevaCatalog).filter(SevaCatalog.is_active == False).count()
    db.query(SevaCatalog).filter(SevaCatalog.is_active == False).delete()
    db.commit()
    return count


def get_transaction_trends(db: Session, days: int = 7):
    """Placeholder for transaction trends"""
    # Logic to be implemented. Returning empty list for now.
    return []

def get_daily_summary(db: Session, date_str: str = None):
    """Placeholder for daily summary"""
    # Logic to be implemented.
    return {"total_active_subscriptions": 0, "today_dispatches": 0, "pending_feedback": 0}


# =============================================================================
# Address Confirmation Functions
# =============================================================================

def send_address_confirmation(db: Session, devotee_id: int):
    """
    Mark that an address confirmation request was sent to the devotee.
    Sets address_confirmation_sent_at timestamp.
    """
    devotee = db.query(Devotee).filter(Devotee.id == devotee_id).first()
    if not devotee:
        raise ValueError(f"Devotee {devotee_id} not found")
    
    devotee.address_confirmation_sent_at = func.now()
    devotee.address_confirmed = False  # Reset confirmed status on re-send
    db.commit()
    db.refresh(devotee)
    return devotee


def confirm_devotee_address(db: Session, devotee_id: int, new_address: str = None, new_area: str = None, new_pincode: str = None):
    """
    Confirm a devotee's address. Optionally update address fields if changed.
    Sets address_confirmed=True and address_confirmed_at timestamp.
    """
    devotee = db.query(Devotee).filter(Devotee.id == devotee_id).first()
    if not devotee:
        raise ValueError(f"Devotee {devotee_id} not found")
    
    # Update address if new values provided
    if new_address is not None:
        devotee.address = new_address
    if new_area is not None:
        devotee.area = new_area
    if new_pincode is not None:
        devotee.pincode = new_pincode
    
    devotee.address_confirmed = True
    devotee.address_confirmed_at = func.now()
    db.commit()
    db.refresh(devotee)
    return devotee


def reset_address_confirmation(db: Session, devotee_id: int):
    """
    Reset address confirmation for a new cycle.
    """
    devotee = db.query(Devotee).filter(Devotee.id == devotee_id).first()
    if not devotee:
        raise ValueError(f"Devotee {devotee_id} not found")
    
    devotee.address_confirmed = False
    devotee.address_confirmed_at = None
    devotee.address_confirmation_sent_at = None
    db.commit()
    db.refresh(devotee)
    return devotee
