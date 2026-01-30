"""
S.T.A.R. Backend - FastAPI Main Application
============================================
Subramanya Temple App & Registry - REST API Server
"""

from fastapi import FastAPI, Depends, HTTPException
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List
from pydantic import BaseModel
from decimal import Decimal
from datetime import date, timedelta
from typing import Optional
from fastapi.responses import StreamingResponse
import io
import csv
from database import get_db
from models import SevaCatalog
from schemas import (
    TransactionCreate, TransactionResponse, SevaResponse,
    ShaswataCreate, ShaswataSubscriptionResponse
)
from crud import (
    create_transaction, get_daily_transactions,
    create_shaswata_subscription, get_shaswata_subscriptions
)


# =============================================================================
# FastAPI Application Setup
# =============================================================================

app = FastAPI(
    title="S.T.A.R. API",
    description="Subramanya Temple App & Registry - Backend API",
    version="1.0.0",
    docs_url="/docs",      # Swagger UI at /docs
    redoc_url="/redoc"     # ReDoc at /redoc
)

# CORS Middleware - Allow all origins for development
# ⚠️ In production, replace ["*"] with specific allowed origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],           # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],           # Allows all HTTP methods
    allow_headers=["*"],           # Allows all headers
)


# =============================================================================
# API Routes - Health Check
# =============================================================================

@app.get("/", tags=["Health"])
def root():
    """
    Health check endpoint.
    Returns a simple message to confirm the API is running.
    """
    return {"message": "S.T.A.R. API is online"}


# =============================================================================
# API Routes - Seva Catalog
# =============================================================================

@app.get("/sevas", response_model=List[SevaResponse], tags=["Seva Catalog"])
def get_all_sevas(db: Session = Depends(get_db)):
    """
    Fetch all sevas from the seva_catalog table.
    
    Returns:
        List of all seva items with their details (id, name, price, flags, etc.)
    """
    sevas = db.query(SevaCatalog).filter(SevaCatalog.is_active == True).all()
    return sevas


@app.get("/sevas/{seva_id}", response_model=SevaResponse, tags=["Seva Catalog"])
def get_seva_by_id(seva_id: int, db: Session = Depends(get_db)):
    """
    Fetch a specific seva by its ID.
    
    Args:
        seva_id: The unique identifier of the seva
        
    Returns:
        Seva details if found
        
    Raises:
        404: If seva not found
    """
    seva = db.query(SevaCatalog).filter(SevaCatalog.id == seva_id).first()
    if seva is None:
        raise HTTPException(status_code=404, detail="Seva not found")
    return seva


# =============================================================================
# API Routes - Booking / Transactions
# =============================================================================

@app.post("/book-seva", response_model=TransactionResponse, tags=["Booking"])
def book_seva(transaction: TransactionCreate, db: Session = Depends(get_db)):
    """
    Book a seva for a devotee.
    
    This endpoint:
    1. Finds or creates a devotee profile based on phone number
    2. Creates a new transaction record
    3. Generates a unique receipt number
    
    Args:
        transaction: Booking details including devotee info, seva_id, amount, payment mode
        
    Returns:
        TransactionResponse with transaction_id, receipt_no, and success message
        
    Raises:
        400: If booking fails (invalid seva_id, etc.)
    """
    try:
        result = create_transaction(db=db, transaction=transaction)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Booking failed: {str(e)}")


@app.get("/transactions/today", tags=["Transactions"])
def get_today_transactions(db: Session = Depends(get_db)):
    """
    Get all transactions for today.
    
    Returns:
        List of today's transactions with receipt numbers and amounts
    """
    return get_daily_transactions(db)


# =============================================================================
# API Routes - Shaswata (Perpetual Puja) Subscriptions
# =============================================================================

@app.post("/shaswata/subscribe", response_model=ShaswataSubscriptionResponse, tags=["Shaswata Subscriptions"])
def subscribe_shaswata(subscription: ShaswataCreate, db: Session = Depends(get_db)):
    """
    Create a new Shaswata (Perpetual) Puja subscription.
    
    This endpoint:
    1. Finds or creates a devotee profile based on phone number
    2. Creates a new subscription record with either LUNAR or GREGORIAN date
    3. Creates a corresponding transaction record for payment tracking
    
    For LUNAR subscriptions (Hindu calendar):
    - Provide: maasa (month), paksha (fortnight), tithi (lunar day)
    - Example: Chaitra Shukla Panchami
    
    For GREGORIAN subscriptions (birthday/anniversary):
    - Provide: event_day (1-31), event_month (1-12)
    - Example: December 25
    
    Returns:
        ShaswataSubscriptionResponse with subscription_id and formatted date
    """
    try:
        result = create_shaswata_subscription(db=db, subscription=subscription)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Subscription failed: {str(e)}")


@app.get("/shaswata/subscriptions", tags=["Shaswata Subscriptions"])
def list_shaswata_subscriptions(
    active_only: bool = True,
    db: Session = Depends(get_db)
):
    """
    Get all Shaswata subscriptions.
    
    Args:
        active_only: If True, only return active subscriptions (default: True)
        
    Returns:
        List of subscriptions with devotee details and formatted dates
    """
    return get_shaswata_subscriptions(db, active_only=active_only)


# =============================================================================
# API Routes - Daily Sankalpa (Priest Dashboard)
# =============================================================================

def get_mock_panchangam() -> dict:
    """Get mock Hindu calendar data for today"""
    return {
        "maasa": "Kartika",
        "paksha": "Shukla", 
        "tithi": "Purnima",
        "nakshatra": "Krittika",
    }

from datetime import datetime
from sqlalchemy import text

@app.get("/daily-sankalpa", tags=["Priest Dashboard"])
def get_daily_sankalpa(db: Session = Depends(get_db)):
    """
    Get today's scheduled pujas for the Priest Dashboard.
    
    Returns JSON with:
    - Today's date and Panchangam
    - List of pujas (both LUNAR and GREGORIAN matches)
    - Each puja includes devotee name, phone, gothra for WhatsApp integration
    """
    today = datetime.now()
    panchangam = get_mock_panchangam()
    
    # Format today's info
    gregorian_info = {
        "day": today.day,
        "month": today.month,
        "year": today.year,
        "weekday": today.strftime("%A"),
        "full_date": today.strftime("%B %d, %Y"),
    }
    
    panchangam_display = f"{panchangam['maasa']} {panchangam['paksha']} {panchangam['tithi']}"
    
    # Query LUNAR subscriptions
    lunar_query = text("""
        SELECT 
            ss.id, d.full_name, d.phone_number, d.gothra,
            sc.name_eng, ss.maasa, ss.paksha, ss.tithi, ss.notes
        FROM shaswata_subscriptions ss
        JOIN devotees d ON ss.devotee_id = d.id
        JOIN seva_catalog sc ON ss.seva_id = sc.id
        WHERE ss.is_active = TRUE
          AND ss.subscription_type = 'LUNAR'
          AND ss.maasa = :maasa
          AND ss.paksha = :paksha
          AND ss.tithi = :tithi
        ORDER BY d.full_name
    """)
    
    lunar_result = db.execute(lunar_query, {
        "maasa": panchangam['maasa'],
        "paksha": panchangam['paksha'],
        "tithi": panchangam['tithi']
    }).fetchall()
    
    lunar_pujas = [
        {
            "id": row[0],
            "name": row[1],
            "phone": row[2],
            "gothra": row[3],
            "seva": row[4],
            "date_info": f"{row[5]} {row[6]} {row[7]}",
            "notes": row[8],
            "type": "LUNAR"
        }
        for row in lunar_result
    ]
    
    # Query GREGORIAN subscriptions
    gregorian_query = text("""
        SELECT 
            ss.id, d.full_name, d.phone_number, d.gothra,
            sc.name_eng, ss.event_day, ss.event_month, ss.notes
        FROM shaswata_subscriptions ss
        JOIN devotees d ON ss.devotee_id = d.id
        JOIN seva_catalog sc ON ss.seva_id = sc.id
        WHERE ss.is_active = TRUE
          AND ss.subscription_type = 'GREGORIAN'
          AND ss.event_day = :day
          AND ss.event_month = :month
        ORDER BY d.full_name
    """)
    
    gregorian_result = db.execute(gregorian_query, {
        "day": today.day,
        "month": today.month
    }).fetchall()
    
    month_names = ["", "January", "February", "March", "April", "May", "June",
                   "July", "August", "September", "October", "November", "December"]
    
    gregorian_pujas = [
        {
            "id": row[0],
            "name": row[1],
            "phone": row[2],
            "gothra": row[3],
            "seva": row[4],
            "date_info": f"{month_names[row[6]]} {row[5]}",
            "notes": row[7],
            "type": "GREGORIAN"
        }
        for row in gregorian_result
    ]
    
    # Combine all pujas
    all_pujas = lunar_pujas + gregorian_pujas
    
    return {
        "date": gregorian_info,
        "panchangam": panchangam_display,
        "panchangam_details": panchangam,
        "lunar_count": len(lunar_pujas),
        "gregorian_count": len(gregorian_pujas),
        "total_count": len(all_pujas),
        "pujas": all_pujas
    }



# =============================================================================
# API Routes - Financial Reports (Day Book)
# =============================================================================

@app.get("/reports/collection", tags=["Financial Reports"])
def get_collection_report(
    start_date: str = None,
    end_date: str = None,
    db: Session = Depends(get_db)
):
    """
    Get collection report for a date range (Day Book).
    
    Args:
        start_date: Optional start date in YYYY-MM-DD format. Defaults to today.
        end_date: Optional end date in YYYY-MM-DD format. Defaults to start_date.
        
    Returns JSON with:
    - Date range info
    - Summary stats
    - List of all transactions
    """
    from datetime import date
    import traceback
    
    # Parse dates
    try:
        if start_date:
            start = datetime.strptime(start_date, "%Y-%m-%d").date()
        else:
            start = date.today()
            
        if end_date:
            end = datetime.strptime(end_date, "%Y-%m-%d").date()
        else:
            end = start
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")
    
    try:
        # Query transactions within date range
        # Use CAST for PostgreSQL compatibility
        transactions_query = text("""
            SELECT 
                t.id,
                t.receipt_no,
                d.full_name as devotee_name,
                d.phone_number,
                sc.name_eng as seva_name,
                t.amount_paid,
                t.payment_mode,
                t.transaction_date,
                t.notes
            FROM transactions t
            JOIN devotees d ON t.devotee_id = d.id
            JOIN seva_catalog sc ON t.seva_id = sc.id
            WHERE CAST(t.transaction_date AS DATE) >= :start_date
              AND CAST(t.transaction_date AS DATE) <= :end_date
            ORDER BY t.transaction_date DESC
        """)
        
        result = db.execute(transactions_query, {
            "start_date": start,
            "end_date": end
        }).fetchall()
        
        # Build transactions list and calculate totals
        transactions = []
        total_cash = 0
        total_upi = 0
        
        for row in result:
            amount = float(row[5]) if row[5] else 0
            payment_mode = str(row[6]) if row[6] else ""
            
            # Accumulate totals
            if payment_mode.upper() == 'CASH':
                total_cash += amount
            elif payment_mode.upper() == 'UPI':
                total_upi += amount
            
            # Format transaction time
            transaction_date = row[7]
            time_str = transaction_date.strftime("%Y-%m-%d %I:%M %p") if transaction_date else ""
            
            transactions.append({
                "id": row[0],
                "receipt_no": row[1],
                "devotee_name": row[2],
                "phone": row[3],
                "seva_name": row[4],
                "amount": amount,
                "payment_mode": payment_mode,
                "time": time_str,
                "notes": row[8]
            })
        
        grand_total = total_cash + total_upi
        
        # Format date display
        if start == end:
            date_display = start.strftime("%B %d, %Y")
        else:
            date_display = f"{start.strftime('%b %d')} - {end.strftime('%b %d, %Y')}"
        
        return {
            "start_date": start.strftime("%Y-%m-%d"),
            "end_date": end.strftime("%Y-%m-%d"),
            "date_display": date_display,
            "summary": {
                "cash": total_cash,
                "upi": total_upi,
                "total": grand_total,
                "transaction_count": len(transactions)
            },
            "transactions": transactions
        }
    except Exception as e:
        error_trace = traceback.format_exc()
        print(f"Error in collection report: {error_trace}")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}\n\nTraceback: {error_trace}")


@app.get("/reports/export", tags=["Financial Reports"])
def export_report(
    start_date: str = None,
    end_date: str = None,
    db: Session = Depends(get_db)
):
    """
    Export collection report as CSV for a date range.
    """
    import csv
    import io
    from datetime import date
    import traceback
    
    # Parse dates
    try:
        if start_date:
            start = datetime.strptime(start_date, "%Y-%m-%d").date()
        else:
            start = date.today()
            
        if end_date:
            end = datetime.strptime(end_date, "%Y-%m-%d").date()
        else:
            end = start
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format")
        
    # Query transactions
    try:
        transactions_query = text("""
            SELECT 
                t.receipt_no,
                t.transaction_date,
                d.full_name as devotee_name,
                sc.name_eng as seva_name,
                t.amount_paid,
                t.payment_mode
            FROM transactions t
            JOIN devotees d ON t.devotee_id = d.id
            JOIN seva_catalog sc ON t.seva_id = sc.id
            WHERE CAST(t.transaction_date AS DATE) >= :start_date
              AND CAST(t.transaction_date AS DATE) <= :end_date
            ORDER BY t.transaction_date DESC
        """)
        
        result = db.execute(transactions_query, {
            "start_date": start,
            "end_date": end
        }).fetchall()
        
        # Create CSV in memory
        output = io.StringIO()
        writer = csv.writer(output)
        
        # Write Header
        writer.writerow(['Receipt No', 'Date', 'Devotee', 'Seva', 'Amount', 'Mode'])
        
        # Write Rows
        for row in result:
            transaction_date = row[1].strftime("%Y-%m-%d %H:%M:%S") if row[1] else ""
            writer.writerow([
                row[0],             # Receipt No
                transaction_date,   # Date
                row[2],             # Devotee
                row[3],             # Seva
                row[4],             # Amount
                row[5]              # Mode
            ])
            
        output.seek(0)
        
        filename = f"report_{start.strftime('%Y-%m-%d')}_to_{end.strftime('%Y-%m-%d')}.csv"
        
        return StreamingResponse(
            io.StringIO(output.getvalue()),
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
        
    except Exception as e:
        error_trace = traceback.format_exc()
        print(f"Error exporting CSV: {error_trace}")
        raise HTTPException(status_code=500, detail=f"Export failed: {str(e)}")


# =============================================================================
# Startup Event
# =============================================================================

@app.on_event("startup")
async def startup_event():
    """Log when the server starts"""
    print("=" * 60)
    print("S.T.A.R. API Server Started")
    print("Subramanya Temple App & Registry")
    print("API Docs: http://localhost:8000/docs")
    print("=" * 60)


# --- ADVANCED REPORTING ENGINE ---

@app.get("/reports/collection")
def get_collection_report(
    db: Session = Depends(get_db), 
    start_date: Optional[date] = None, 
    end_date: Optional[date] = None
):
    # Default to "Today" if no dates provided
    if not start_date:
        start_date = date.today()
    if not end_date:
        end_date = date.today()

    # Query Transactions within range
    query = db.query(models.Transaction).filter(
        func.date(models.Transaction.created_at) >= start_date,
        func.date(models.Transaction.created_at) <= end_date
    )
    
    transactions = query.all()

    # Calculate Totals
    total_cash = sum(t.amount for t in transactions if t.payment_mode == "CASH")
    total_upi = sum(t.amount for t in transactions if t.payment_mode == "UPI")
    grand_total = total_cash + total_upi

    return {
        "range": {"start": start_date, "end": end_date},
        "summary": {"cash": total_cash, "upi": total_upi, "total": grand_total},
        "transactions": transactions
    }

@app.get("/reports/export")
def export_report(
    db: Session = Depends(get_db), 
    start_date: Optional[date] = None, 
    end_date: Optional[date] = None
):
    # Same filtering logic
    if not start_date: start_date = date.today()
    if not end_date: end_date = date.today()

    transactions = db.query(models.Transaction).filter(
        func.date(models.Transaction.created_at) >= start_date,
        func.date(models.Transaction.created_at) <= end_date
    ).all()

    # Create CSV in Memory
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Header
    writer.writerow(["Receipt No", "Date", "Devotee Name", "Seva", "Amount", "Mode"])
    
    # Rows
    for t in transactions:
        writer.writerow([
            t.id, 
            t.created_at.strftime("%Y-%m-%d %H:%M"), 
            t.devotee_name, 
            t.seva_id, # You might want to fetch Seva Name if possible, or join tables
            t.amount, 
            t.payment_mode
        ])
    
    output.seek(0)
    
    # Return as File Download
    filename = f"report_{start_date}_{end_date}.csv"
    return StreamingResponse(
        io.BytesIO(output.getvalue().encode()), 
        media_type="text/csv", 
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )