# S.T.A.R. Backend - FastAPI Main Application
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date, datetime
import io
import csv
import traceback
from sqlalchemy import text, func

from database import get_db
from models import SevaCatalog
from schemas import (
    TransactionCreate, TransactionResponse, SevaResponse,
    ShaswataCreate, ShaswataSubscriptionResponse,
    UserCreate, UserLogin, Token, TokenData
)
from crud import (
    create_transaction, get_daily_transactions,
    create_shaswata_subscription, get_shaswata_subscriptions,
    get_financial_report
)
from panchang import PanchangCalculator

# Authentication Imports
from passlib.context import CryptContext
from jose import JWTError, jwt
from datetime import timedelta
from models import User

# =============================================================================
# FastAPI Application Setup
# =============================================================================

app = FastAPI(
    title="S.T.A.R. API",
    description="Subramanya Temple App & Registry - Backend API",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =============================================================================
# Authentication Configuration & Helpers
# =============================================================================

# SECRET_KEY should be kept secret in production!
SECRET_KEY = "supersecretkey_change_this_for_production"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 hours

ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 hours

pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
        token_data = TokenData(username=username)
    except JWTError:
        raise credentials_exception
        
    user = db.query(User).filter(User.username == token_data.username).first()
    if user is None:
        raise credentials_exception
    return user

# =============================================================================
# Auth Routes
# =============================================================================

@app.post("/create-admin", response_model=Token, tags=["Authentication"])
def create_initial_admin(db: Session = Depends(get_db)):
    """One-time setup endpoint to create the admin user"""
    # Check if admin already exists
    user = db.query(User).filter(User.username == "admin").first()
    if user:
        raise HTTPException(status_code=400, detail="Admin user already exists")
    
    hashed_pwd = get_password_hash("password123")
    new_user = User(username="admin", hashed_password=hashed_pwd, role="admin")
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # Generate token
    access_token = create_access_token(data={"sub": new_user.username})
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/token", response_model=Token, tags=["Authentication"])
def login_for_access_token(form_data: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

# =============================================================================
# API Routes - Health & Sevas
# =============================================================================

@app.get("/", tags=["Health"])
def root():
    return {"message": "S.T.A.R. API is online"}

@app.get("/sevas", response_model=List[SevaResponse], tags=["Seva Catalog"])
def get_all_sevas(db: Session = Depends(get_db)):
    return db.query(SevaCatalog).filter(SevaCatalog.is_active == True).all()

@app.get("/sevas/{seva_id}", response_model=SevaResponse, tags=["Seva Catalog"])
def get_seva_by_id(seva_id: int, db: Session = Depends(get_db)):
    seva = db.query(SevaCatalog).filter(SevaCatalog.id == seva_id).first()
    if seva is None:
        raise HTTPException(status_code=404, detail="Seva not found")
    return seva

# =============================================================================
# API Routes - Booking / Transactions
# =============================================================================

@app.get("/reports")
def get_reports(start_date: str, end_date: str, db: Session = Depends(get_db)):
    """
    Get financial reports and seva statistics for a date range.
    """
    try:
        report = get_financial_report(db, start_date, end_date)
        # Add period info to match requested structure
        report["period"] = {"start": start_date, "end": end_date}
        return report
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/book-seva", response_model=TransactionResponse, tags=["Booking"])
def book_seva(transaction: TransactionCreate, db: Session = Depends(get_db)):
    try:
        return create_transaction(db=db, transaction=transaction)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Booking failed: {str(e)}")

@app.get("/transactions/today", tags=["Transactions"])
def get_today_transactions(db: Session = Depends(get_db)):
    return get_daily_transactions(db)

# =============================================================================
# API Routes - Devotee Management (Auto-Fill) -- NEW ADDITION
# =============================================================================

@app.get("/devotees/{phone}", tags=["Devotees"])
def get_devotee_details(phone: str, db: Session = Depends(get_db)):
    """Fetch devotee details by phone number for Auto-Fill (bilingual)."""
    query = text("""
        SELECT full_name_en, full_name_kn, gothra_en, gothra_kn, nakshatra, rashi 
        FROM devotees WHERE phone_number = :phone
    """)
    result = db.execute(query, {"phone": phone}).fetchone()
    
    if not result:
        raise HTTPException(status_code=404, detail="Devotee not found")
        
    return {
        "full_name": result[0],       # Backward compat
        "full_name_en": result[0],
        "full_name_kn": result[1],
        "gothra": result[2],          # Backward compat
        "gothra_en": result[2],
        "gothra_kn": result[3],
        "nakshatra": result[4],
        "rashi": result[5]
    }

# =============================================================================
# API Routes - Shaswata (Perpetual Puja)
# =============================================================================

@app.post("/shaswata/subscribe", response_model=ShaswataSubscriptionResponse, tags=["Shaswata"])
def subscribe_shaswata(subscription: ShaswataCreate, db: Session = Depends(get_db)):
    try:
        return create_shaswata_subscription(db=db, subscription=subscription)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Subscription failed: {str(e)}")

@app.get("/shaswata/subscriptions", tags=["Shaswata"])
def list_shaswata_subscriptions(active_only: bool = True, db: Session = Depends(get_db)):
    return get_shaswata_subscriptions(db, active_only=active_only)

@app.get("/shaswata/list", tags=["Shaswata"])
def list_shaswata_alias(active_only: bool = True, db: Session = Depends(get_db)):
    """Alias for /shaswata/subscriptions for frontend compatibility."""
    return get_shaswata_subscriptions(db, active_only=active_only)


# =============================================================================
# API Routes - Priest Dashboard
# =============================================================================

@app.get("/daily-sankalpa", tags=["Priest Dashboard"])
def get_daily_sankalpa(date_str: str = None, db: Session = Depends(get_db)):
    """
    Get daily sankalpa/schedule. 
    If date_str provided (DD-MM-YYYY), use that date. 
    Otherwise default to today.
    """
    try:
        if date_str:
            # Parse DD-MM-YYYY format
            target_date = datetime.strptime(date_str, "%d-%m-%Y").date()
        else:
            target_date = date.today()
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use DD-MM-YYYY")

    # Calculate Panchangam using Astronomical Data
    pc = PanchangCalculator()
    panchang_data = pc.calculate(target_date)
    
    panchangam = {
        "maasa": panchang_data["maasa"],
        "is_adhika": panchang_data.get("is_adhika", False),
        "paksha": panchang_data["paksha"],
        "tithi": panchang_data["tithi"],
        "nakshatra": panchang_data["nakshatra"],
        "description": panchang_data.get("description", f"{panchang_data['maasa']} {panchang_data['paksha']} {panchang_data['tithi']}"),
        "sunrise": panchang_data.get("sunrise", "-"),
        "sunset": panchang_data.get("sunset", "-"),
        "moonrise": panchang_data.get("moonrise", "-"),
        "rahukala": panchang_data.get("rahukala", "-"),
        "yamaganda": panchang_data.get("yamaganda", "-"),
        "yoga": panchang_data.get("yoga", "-"),
        "karana": panchang_data.get("karana", "-")
    }
    
    # 1. Lunar Query - Find subscriptions matching TODAY's Tithi
    lunar_query = text("""
        SELECT ss.id, d.full_name_en, d.phone_number, d.gothra_en, sc.name_eng, ss.maasa, ss.paksha, ss.tithi, ss.notes
        FROM shaswata_subscriptions ss
        JOIN devotees d ON ss.devotee_id = d.id
        JOIN seva_catalog sc ON ss.seva_id = sc.id
        WHERE ss.is_active = TRUE 
        AND ss.subscription_type = 'LUNAR'
        AND ss.maasa = :maasa
        AND ss.paksha = :paksha
        AND ss.tithi = :tithi
    """)
    
    lunar_result = db.execute(lunar_query, {
        "maasa": panchangam["maasa"],
        "paksha": panchangam["paksha"],
        "tithi": panchangam["tithi"]
    }).fetchall()
    
    lunar_pujas = [{
        "id": row[0], "name": row[1], "phone": row[2], "gothra": row[3],
        "seva": row[4], "date_info": f"{row[5]} {row[6]} {row[7]}", "notes": row[8], "type": "LUNAR"
    } for row in lunar_result]
    
    # 2. Gregorian Query (Dynamic based on selected date)
    gregorian_query = text("""
        SELECT ss.id, d.full_name_en, d.phone_number, d.gothra_en, sc.name_eng, ss.event_day, ss.event_month, ss.notes
        FROM shaswata_subscriptions ss
        JOIN devotees d ON ss.devotee_id = d.id
        JOIN seva_catalog sc ON ss.seva_id = sc.id
        WHERE ss.is_active = TRUE AND ss.subscription_type = 'GREGORIAN'
          AND ss.event_day = :day AND ss.event_month = :month
    """)
    gregorian_result = db.execute(gregorian_query, {"day": target_date.day, "month": target_date.month}).fetchall()
    
    gregorian_pujas = [{
        "id": row[0], "name": row[1], "phone": row[2], "gothra": row[3],
        "seva": row[4], "date_info": f"{row[5]}/{row[6]}", "notes": row[7], "type": "GREGORIAN"
    } for row in gregorian_result]

    # 3. One-Time Transactions (Check BOTH seva_date AND transaction_date)
    transaction_query = text("""
        SELECT t.id, t.devotee_name, d.phone_number, d.gothra_en, s.name_eng, t.notes
        FROM transactions t
        JOIN devotees d ON t.devotee_id = d.id
        JOIN seva_catalog s ON t.seva_id = s.id
        WHERE t.seva_date = :date 
           OR CAST(t.transaction_date AS DATE) = :date
    """)
    transaction_result = db.execute(transaction_query, {"date": target_date}).fetchall()

    transaction_pujas = [{
        "id": row[0], "name": row[1], "phone": row[2], "gothra": row[3],
        "seva": row[4], "date_info": "One-Time", "notes": row[5] or "Booked via App", "type": "BOOKING"
    } for row in transaction_result]
    
    # 4. Calculate Daily Revenue
    revenue_query = text("""
        SELECT SUM(amount) FROM transactions 
        WHERE seva_date = :date OR CAST(transaction_date AS DATE) = :date
    """)
    daily_revenue = db.execute(revenue_query, {"date": target_date}).scalar() or 0

    return {
        "date": {"day": target_date.day, "month": target_date.month, "year": target_date.year, "weekday": target_date.strftime("%A")},
        "panchangam": panchangam,
        "pujas": lunar_pujas + gregorian_pujas + transaction_pujas,
        "revenue": daily_revenue,
        "festivals": ["Shiva Rathri (Upcoming)", "Pradosha"] if panchangam["maasa"] == "Magha" else ["Daily Sevas"]
    }

# =============================================================================
# API Routes - Financial Reports (CLEAN VERSION)
# =============================================================================

@app.get("/reports/collection", tags=["Financial Reports"])
def get_collection_report(start_date: str = None, end_date: str = None, db: Session = Depends(get_db)):
    try:
        # Parse DD-MM-YYYY format
        start = datetime.strptime(start_date, "%d-%m-%Y").date() if start_date else date.today()
        end = datetime.strptime(end_date, "%d-%m-%Y").date() if end_date else start
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use DD-MM-YYYY")
    
    try:
        query = text("""
            SELECT t.id, t.receipt_no, d.full_name_en, d.phone_number, sc.name_eng, 
                   t.amount_paid, t.payment_mode, t.transaction_date, t.notes
            FROM transactions t
            JOIN devotees d ON t.devotee_id = d.id
            JOIN seva_catalog sc ON t.seva_id = sc.id
            WHERE CAST(t.transaction_date AS DATE) >= :start AND CAST(t.transaction_date AS DATE) <= :end
            ORDER BY t.transaction_date DESC
        """)
        result = db.execute(query, {"start": start, "end": end}).fetchall()
        
        transactions = []
        total_cash, total_upi = 0, 0
        
        for row in result:
            amt = float(row[5] or 0)
            mode = str(row[6] or "").upper()
            if mode == 'CASH': total_cash += amt
            elif mode == 'UPI': total_upi += amt
            
            transactions.append({
                "id": row[0], "receipt_no": row[1], "devotee_name": row[2], "phone": row[3],
                "seva_name": row[4], "amount": amt, "payment_mode": mode,
                "time": row[7].strftime("%Y-%m-%d %I:%M %p") if row[7] else "", "notes": row[8]
            })
            
        return {
            "start_date": start, "end_date": end,
            "summary": {"cash": total_cash, "upi": total_upi, "total": total_cash + total_upi},
            "transactions": transactions
        }
    except Exception as e:
        print(f"Error: {e}")
        raise HTTPException(status_code=500, detail="Database error")

@app.get("/reports/export", tags=["Financial Reports"])
def export_report(start_date: str = None, end_date: str = None, db: Session = Depends(get_db)):
    try:
        # Standardize on YYYY-MM-DD from frontend
        start = datetime.strptime(start_date, "%Y-%m-%d").date() if start_date else date.today()
        end = datetime.strptime(end_date, "%Y-%m-%d").date() if end_date else start
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")

    transactions = db.execute(text("""
        SELECT t.receipt_no, t.transaction_date, d.full_name_en, sc.name_eng, t.amount_paid, t.payment_mode
        FROM transactions t
        JOIN devotees d ON t.devotee_id = d.id
        JOIN seva_catalog sc ON t.seva_id = sc.id
        WHERE CAST(t.transaction_date AS DATE) >= :start AND CAST(t.transaction_date AS DATE) <= :end
        ORDER BY t.transaction_date DESC
    """), {"start": start, "end": end}).fetchall()
    
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(['Receipt No', 'Date', 'Devotee', 'Seva', 'Amount', 'Mode'])
    for row in transactions:
        writer.writerow([row[0], row[1], row[2], row[3], row[4], row[5]])
    
    output.seek(0)
    filename = f"report_{start}_{end}.csv"
    return StreamingResponse(io.StringIO(output.getvalue()), media_type="text/csv", headers={"Content-Disposition": f"attachment; filename={filename}"})