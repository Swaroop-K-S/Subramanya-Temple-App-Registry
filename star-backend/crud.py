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


def get_or_create_devotee(db: Session, name: str, phone: str, gothra: str = None, 
                          nakshatra: str = None, rashi: str = None) -> int:
    """
    Find an existing devotee by phone number, or create a new one.
    
    Args:
        db: Database session
        name: Devotee's full name
        phone: Phone number (used as unique identifier)
        gothra: Optional gotra
        nakshatra: Optional birth star
        rashi: Optional zodiac sign
        
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
                SET full_name = :name, gothra = COALESCE(:gothra, gothra), 
                    nakshatra = COALESCE(:nakshatra, nakshatra),
                    rashi = COALESCE(:rashi, rashi),
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = :id
            """),
            {"name": name, "gothra": gothra, "nakshatra": nakshatra, "rashi": rashi, "id": devotee_id}
        )
        db.commit()
        return devotee_id
    else:
        # Create new devotee
        result = db.execute(
            text("""
                INSERT INTO devotees (full_name, phone_number, gothra, nakshatra, rashi)
                VALUES (:name, :phone, :gothra, :nakshatra, :rashi)
                RETURNING id
            """),
            {"name": name, "phone": phone, "gothra": gothra, "nakshatra": nakshatra, "rashi": rashi}
        )
        db.commit()
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
        # Step 1: Get or create devotee
        devotee_id = get_or_create_devotee(
            db=db,
            name=transaction.devotee_name,
            phone=transaction.phone_number,
            gothra=transaction.gothra,
            nakshatra=transaction.nakshatra,
            rashi=transaction.rashi
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
                 devotee_name, created_by_user_id, transaction_date)
                VALUES 
                (:receipt_no, :devotee_id, :seva_id, :amount, CAST(:payment_mode AS payment_mode),
                 :devotee_name, :user_id, CURRENT_TIMESTAMP)
                RETURNING id
            """),
            {
                "receipt_no": receipt_no,
                "devotee_id": devotee_id,
                "seva_id": transaction.seva_id,
                "amount": transaction.amount,
                "payment_mode": transaction.payment_mode.value,
                "devotee_name": transaction.devotee_name,
                "user_id": user_id
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


# =============================================================================
# SHASWATA (PERPETUAL PUJA) OPERATIONS
# =============================================================================

def create_shaswata_subscription(db: Session, subscription: ShaswataCreate, user_id: int = 1) -> dict:
    """
    Create a new Shaswata (Perpetual) Puja subscription.
    
    This function:
    1. Finds or creates the devotee based on phone number
    2. Creates the subscription record with lunar or Gregorian date info
    3. Also creates a transaction record for the payment
    
    Args:
        db: Database session
        subscription: ShaswataCreate schema with subscription details
        user_id: ID of the staff member creating this subscription
        
    Returns:
        dict with subscription_id and formatted date info
    """
    try:
        # Step 1: Get or create devotee
        devotee_id = get_or_create_devotee(
            db=db,
            name=subscription.devotee_name,
            phone=subscription.phone_number,
            gothra=subscription.gothra,
            nakshatra=subscription.nakshatra
        )
        
        # Step 2: Get seva name for the response
        seva_result = db.execute(
            text("SELECT name_eng FROM seva_catalog WHERE id = :seva_id"),
            {"seva_id": subscription.seva_id}
        ).fetchone()
        
        if not seva_result:
            raise ValueError(f"Seva with ID {subscription.seva_id} not found")
        
        seva_name = seva_result[0]
        
        # Step 3: Insert shaswata subscription
        result = db.execute(
            text("""
                INSERT INTO shaswata_subscriptions 
                (devotee_id, seva_id, subscription_type, 
                 event_day, event_month, 
                 maasa, paksha, tithi, 
                 notes, is_active)
                VALUES 
                (:devotee_id, :seva_id, :sub_type,
                 :event_day, :event_month,
                 :maasa, :paksha, :tithi,
                 :notes, TRUE)
                RETURNING id
            """),
            {
                "devotee_id": devotee_id,
                "seva_id": subscription.seva_id,
                "sub_type": subscription.subscription_type.value,
                "event_day": subscription.event_day,
                "event_month": subscription.event_month,
                "maasa": subscription.maasa.value if subscription.maasa else None,
                "paksha": subscription.paksha.value if subscription.paksha else None,
                "tithi": subscription.tithi.value if subscription.tithi else None,
                "notes": subscription.notes
            }
        )
        
        subscription_id = result.fetchone()[0]
        
        # Step 4: Also create a transaction for the payment
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
                "payment_mode": subscription.payment_mode.value,
                "devotee_name": subscription.devotee_name,
                "user_id": user_id,
                "notes": f"Shaswata Subscription #{subscription_id}"
            }
        )
        
        db.commit()
        
        # Step 5: Format response
        lunar_date = None
        gregorian_date = None
        
        if subscription.subscription_type == SubscriptionType.LUNAR:
            lunar_date = f"{subscription.maasa.value} {subscription.paksha.value} {subscription.tithi.value}"
        else:
            month_names = ["", "January", "February", "March", "April", "May", "June",
                          "July", "August", "September", "October", "November", "December"]
            gregorian_date = f"{month_names[subscription.event_month]} {subscription.event_day}"
        
        return {
            "subscription_id": subscription_id,
            "devotee_name": subscription.devotee_name,
            "seva_name": seva_name,
            "subscription_type": subscription.subscription_type.value,
            "lunar_date": lunar_date,
            "gregorian_date": gregorian_date,
            "amount_paid": subscription.amount,
            "receipt_no": receipt_no,
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
            ss.id, d.full_name, d.phone_number, d.gothra,
            sc.name_eng as seva_name,
            ss.subscription_type, ss.maasa, ss.paksha, ss.tithi,
            ss.event_day, ss.event_month,
            ss.last_performed_year, ss.notes, ss.is_active
        FROM shaswata_subscriptions ss
        JOIN devotees d ON ss.devotee_id = d.id
        JOIN seva_catalog sc ON ss.seva_id = sc.id
    """
    
    if active_only:
        query += " WHERE ss.is_active = TRUE"
    
    query += " ORDER BY ss.created_at DESC"
    
    result = db.execute(text(query)).fetchall()
    
    subscriptions = []
    for row in result:
        sub = {
            "id": row[0],
            "devotee_name": row[1],
            "phone_number": row[2],
            "gothra": row[3],
            "seva_name": row[4],
            "subscription_type": row[5],
            "is_active": row[13]
        }
        
        if row[5] == "LUNAR":
            sub["lunar_date"] = f"{row[6]} {row[7]} {row[8]}" if row[6] else None
        else:
            month_names = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun",
                          "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
            sub["gregorian_date"] = f"{month_names[row[10]]} {row[9]}" if row[9] else None
        
        sub["last_performed_year"] = row[11]
        sub["notes"] = row[12]
        subscriptions.append(sub)
    
    return subscriptions

