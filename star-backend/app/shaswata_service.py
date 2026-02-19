"""
S.T.A.R. Backend - Shaswata Seva Service
==========================================
Core business logic for Shaswata (Perpetual Pooja) lifecycle management.

Responsibilities:
1. Event Population — Auto-generate upcoming `shaswata_events` for next 30 days
2. Messaging — Abstraction layer for WhatsApp/SMS (Console mode for V1)
3. Delivery Feedback — 4-day post-dispatch follow-up logic
"""

from datetime import date, datetime, timedelta
from sqlalchemy import text
from sqlalchemy.orm import Session

from .panchang import PanchangCalculator


# =============================================================================
# 1. EVENT POPULATION SERVICE
# =============================================================================

def populate_upcoming_events(db: Session, days_ahead: int = 30) -> dict:
    """
    Daily Job: Scan all active subscriptions and create `shaswata_events`
    for any seva scheduled within the next `days_ahead` days.
    
    Logic:
    - GREGORIAN: Match event_day + event_month against each date in range
    - LUNAR: Use PanchangCalculator to compute Tithi for each date and match
    
    Idempotent: Skips if an event already exists for that subscription + year + date.
    
    Returns: Summary dict with counts of events created.
    """
    today = date.today()
    current_year = today.year
    pc = PanchangCalculator()
    
    events_created = 0
    events_skipped = 0
    errors = []
    
    # --- Fetch all active subscriptions ---
    subs = db.execute(text("""
        SELECT id, subscription_type, event_day, event_month, 
               maasa, paksha, tithi, devotee_id
        FROM shaswata_subscriptions
        WHERE is_active = 1
    """)).fetchall()
    
    if not subs:
        return {"events_created": 0, "events_skipped": 0, "message": "No active subscriptions found"}
    
    # --- Pre-compute Panchangam for every day in the range ---
    panchangam_cache = {}
    for offset in range(days_ahead):
        target_date = today + timedelta(days=offset)
        try:
            panchang = pc.calculate(target_date)
            panchangam_cache[target_date] = panchang["attributes"]
        except Exception as e:
            errors.append(f"Panchang error for {target_date}: {str(e)}")
            continue
    
    for sub in subs:
        sub_id, sub_type, event_day, event_month, maasa, paksha, tithi, devotee_id = sub
        
        try:
            if sub_type == "GREGORIAN":
                # Check if the fixed date falls within next N days
                try:
                    target = date(current_year, event_month, event_day)
                except (ValueError, TypeError):
                    continue  # Invalid date (e.g., Feb 30)
                
                if today <= target <= today + timedelta(days=days_ahead):
                    _create_event_if_not_exists(db, sub_id, target, current_year)
                    events_created += 1
                else:
                    events_skipped += 1
                    
            elif sub_type == "LUNAR":
                # Scan each day — if Panchangam matches Maasa+Paksha+Tithi, create event
                for target_date, attrs in panchangam_cache.items():
                    if (attrs.get("maasa") == maasa and 
                        attrs.get("paksha") == paksha and 
                        attrs.get("tithi") == tithi):
                        
                        created = _create_event_if_not_exists(db, sub_id, target_date, current_year)
                        if created:
                            events_created += 1
                        else:
                            events_skipped += 1
                        break  # Only one match per cycle
                        
        except Exception as e:
            errors.append(f"Sub {sub_id}: {str(e)}")
    
    db.commit()
    
    return {
        "events_created": events_created,
        "events_skipped": events_skipped,
        "days_scanned": days_ahead,
        "subscriptions_checked": len(subs),
        "errors": errors if errors else None,
        "message": f"Populated {events_created} new events ({events_skipped} already existed)"
    }


def _create_event_if_not_exists(db: Session, subscription_id: int, scheduled_date: date, year: int) -> bool:
    """
    Insert a shaswata_event only if one doesn't already exist for this sub+year+date.
    Returns True if created, False if already exists.
    """
    existing = db.execute(text("""
        SELECT id FROM shaswata_events 
        WHERE subscription_id = :sub_id AND year = :year AND scheduled_date = :sched_date
    """), {"sub_id": subscription_id, "year": year, "sched_date": scheduled_date}).fetchone()
    
    if existing:
        return False
    
    db.execute(text("""
        INSERT INTO shaswata_events (subscription_id, scheduled_date, year, status)
        VALUES (:sub_id, :sched_date, :year, 'PENDING')
    """), {"sub_id": subscription_id, "sched_date": scheduled_date, "year": year})
    
    return True


# =============================================================================
# 2. UPCOMING EVENTS QUERY (For Admin Dashboard)
# =============================================================================

def get_upcoming_events(db: Session, days_ahead: int = 30) -> list:
    """
    Get all shaswata events scheduled within the next N days.
    Enriched with devotee details and subscription info.
    Used by the Admin Dashboard's "Shaswata Manager" view.
    """
    today = date.today()
    end_date = today + timedelta(days=days_ahead)
    
    result = db.execute(text("""
        SELECT 
            se.id, se.subscription_id, se.scheduled_date, se.status,
            se.dispatch_date, se.dispatch_ref, se.dispatch_method,
            se.delivery_status, se.delivery_checked_at,
            d.id as devotee_id, d.full_name_en, d.phone_number, 
            d.address, d.area, d.pincode,
            d.address_confirmed, d.address_confirmed_at,
            sc.name_eng as seva_name,
            ss.subscription_type, ss.occasion, ss.communication_preference,
            ss.maasa, ss.paksha, ss.tithi, ss.event_day, ss.event_month
        FROM shaswata_events se
        JOIN shaswata_subscriptions ss ON se.subscription_id = ss.id
        JOIN devotees d ON ss.devotee_id = d.id
        JOIN seva_catalog sc ON ss.seva_id = sc.id
        WHERE se.scheduled_date >= :start AND se.scheduled_date <= :end
        ORDER BY se.scheduled_date ASC, se.status ASC
    """), {"start": str(today), "end": str(end_date)}).fetchall()
    
    events = []
    for row in result:
        # Build date_info string based on subscription type
        sub_type = row[18]
        if sub_type == "LUNAR":
            date_info = f"{row[21]} {row[22]} {row[23]}"  # Maasa Paksha Tithi
        else:
            month_names = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun",
                          "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
            m = row[25] if row[25] and 0 < row[25] <= 12 else 0
            date_info = f"{month_names[m]} {row[24]}" if m else "N/A"
        
        events.append({
            "event_id": row[0],
            "subscription_id": row[1],
            "scheduled_date": str(row[2]),
            "status": row[3],
            "dispatch_date": str(row[4]) if row[4] else None,
            "dispatch_ref": row[5],
            "dispatch_method": row[6],
            "delivery_status": row[7],
            "delivery_checked_at": str(row[8]) if row[8] else None,
            "devotee_id": row[9],
            "devotee_name": row[10],
            "phone": row[11],
            "address": row[12],
            "area": row[13],
            "pincode": row[14],
            "address_confirmed": bool(row[15]),
            "address_confirmed_at": str(row[16]) if row[16] else None,
            "seva_name": row[17],
            "subscription_type": sub_type,
            "occasion": row[19],
            "communication_preference": row[20],
            "date_info": date_info
        })
    
    return events


# =============================================================================
# 3. EVENT LIFECYCLE ACTIONS
# =============================================================================

def mark_event_dispatched(db: Session, event_id: int, dispatch_ref: str = None, 
                          dispatch_method: str = "POST") -> dict:
    """
    Mark a shaswata_event as DISPATCHED. 
    Also logs a CommunicationLog entry and updates the parent subscription.
    """
    event = db.execute(text(
        "SELECT id, subscription_id, status FROM shaswata_events WHERE id = :eid"
    ), {"eid": event_id}).fetchone()
    
    if not event:
        raise ValueError(f"Event {event_id} not found")
    
    if event[2] == "DISPATCHED":
        return {"event_id": event_id, "message": "Already dispatched", "status": "DISPATCHED"}
    
    today_str = str(date.today())
    
    # Update event
    db.execute(text("""
        UPDATE shaswata_events 
        SET status = 'DISPATCHED', 
            dispatch_date = :today, 
            dispatch_ref = :ref,
            dispatch_method = :method,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = :eid
    """), {"today": today_str, "ref": dispatch_ref, "method": dispatch_method, "eid": event_id})
    
    # Also update parent subscription's last_dispatch_date
    db.execute(text("""
        UPDATE shaswata_subscriptions 
        SET last_dispatch_date = :today, updated_at = CURRENT_TIMESTAMP
        WHERE id = :sub_id
    """), {"today": today_str, "sub_id": event[1]})
    
    # Log the dispatch notification
    devotee = db.execute(text("""
        SELECT d.id, d.phone_number FROM devotees d
        JOIN shaswata_subscriptions ss ON d.id = ss.devotee_id
        WHERE ss.id = :sub_id
    """), {"sub_id": event[1]}).fetchone()
    
    if devotee:
        _log_communication(db, devotee[0], event[1], event_id, 
                          "DISPATCH", "WHATSAPP", devotee[1],
                          f"Prasadam dispatched for your Shaswata Seva. Ref: {dispatch_ref or 'N/A'}")
    
    db.commit()
    
    return {
        "event_id": event_id,
        "status": "DISPATCHED",
        "dispatch_date": today_str,
        "dispatch_ref": dispatch_ref,
        "message": "Prasadam dispatch logged & notification queued"
    }


def record_delivery_feedback(db: Session, event_id: int, received: bool, 
                              notes: str = None) -> dict:
    """
    Record delivery feedback from devotee.
    If NOT received: flag as ADDRESS_CHANGED or NOT_RECEIVED for follow-up.
    """
    event = db.execute(text(
        "SELECT id, subscription_id FROM shaswata_events WHERE id = :eid"
    ), {"eid": event_id}).fetchone()
    
    if not event:
        raise ValueError(f"Event {event_id} not found")
    
    status = "RECEIVED" if received else ("ADDRESS_CHANGED" if notes and "address" in notes.lower() else "NOT_RECEIVED")
    today_str = str(date.today())
    
    db.execute(text("""
        UPDATE shaswata_events 
        SET delivery_status = :status,
            delivery_checked_at = :today,
            delivery_notes = :notes,
            status = CASE WHEN :received THEN 'DELIVERED' ELSE status END,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = :eid
    """), {"status": status, "today": today_str, "notes": notes, "received": received, "eid": event_id})
    
    # Log feedback communication
    devotee = db.execute(text("""
        SELECT d.id, d.phone_number FROM devotees d
        JOIN shaswata_subscriptions ss ON d.id = ss.devotee_id
        WHERE ss.id = :sub_id
    """), {"sub_id": event[1]}).fetchone()
    
    if devotee:
        _log_communication(db, devotee[0], event[1], event_id,
                          "DELIVERY_CHECK", "WHATSAPP", devotee[1],
                          f"Delivery feedback: {status}. Notes: {notes or 'None'}")
    
    db.commit()
    
    return {
        "event_id": event_id,
        "delivery_status": status,
        "message": "Feedback recorded" if received else "Follow-up required — devotee did not receive prasadam"
    }



def dispatch_adhoc_event(db: Session, subscription_id: int, dispatch_date: date, 
                        dispatch_ref: str = None, dispatch_method: str = "POST") -> dict:
    """
    Handle dispatch for a specific date, creating the event if it doesn't exist yet.
    Used by Manual Dispatch in Search Tab (Legacy unification).
    """
    year = dispatch_date.year
    
    # 1. Ensure event exists
    # If the date is valid, we create the event record on the fly
    _create_event_if_not_exists(db, subscription_id, dispatch_date, year)
    
    # 2. Fetch the event ID (it should exist now)
    event = db.execute(text("""
        SELECT id FROM shaswata_events 
        WHERE subscription_id = :sid AND scheduled_date = :date
    """), {"sid": subscription_id, "date": dispatch_date}).fetchone()
    
    if not event:
        raise ValueError("Failed to create or retrieve event for ad-hoc dispatch")
        
    # 3. Mark as dispatched using standard logic
    return mark_event_dispatched(db, event[0], dispatch_ref, dispatch_method)


def get_pending_delivery_checks(db: Session) -> list:
    """
    Get all events that were dispatched 4+ days ago but haven't received delivery feedback.
    These are candidates for the "Did you receive Prasadam?" follow-up message.
    """
    result = db.execute(text("""
        SELECT 
            se.id, se.subscription_id, se.scheduled_date, se.dispatch_date,
            d.id as devotee_id, d.full_name_en, d.phone_number, d.address,
            sc.name_eng as seva_name, ss.communication_preference
        FROM shaswata_events se
        JOIN shaswata_subscriptions ss ON se.subscription_id = ss.id
        JOIN devotees d ON ss.devotee_id = d.id
        JOIN seva_catalog sc ON ss.seva_id = sc.id
        WHERE se.status = 'DISPATCHED'
          AND se.delivery_status IS NULL
          AND DATE(se.dispatch_date, '+4 days') <= DATE('now')
        ORDER BY se.dispatch_date ASC
    """)).fetchall()
    
    return [{
        "event_id": row[0],
        "subscription_id": row[1],
        "scheduled_date": str(row[2]),
        "dispatch_date": str(row[3]),
        "days_since_dispatch": (date.today() - date.fromisoformat(str(row[3]))).days,
        "devotee_id": row[4],
        "devotee_name": row[5],
        "phone": row[6],
        "address": row[7],
        "seva_name": row[8],
        "preferred_channel": row[9]
    } for row in result]


# =============================================================================
# 4. MESSAGING SERVICE (V1: Console/Log Mode)
# =============================================================================

class MessagingService:
    """
    Abstraction for sending messages to devotees.
    V1: Prints to console + logs to communication_logs table.
    V2: Will integrate with Twilio/Interakt WhatsApp API.
    """
    
    @staticmethod
    def send_reminder(db: Session, event_id: int) -> dict:
        """Send 'Pooja Tomorrow' reminder for an upcoming event."""
        event = db.execute(text("""
            SELECT se.id, se.scheduled_date, 
                   d.id, d.full_name_en, d.phone_number,
                   sc.name_eng, ss.id, ss.communication_preference
            FROM shaswata_events se
            JOIN shaswata_subscriptions ss ON se.subscription_id = ss.id
            JOIN devotees d ON ss.devotee_id = d.id
            JOIN seva_catalog sc ON ss.seva_id = sc.id
            WHERE se.id = :eid
        """), {"eid": event_id}).fetchone()
        
        if not event:
            return {"status": "FAILED", "error": "Event not found"}
        
        message = (
            f"🙏 Namaste {event[3]}!\n"
            f"Your Shaswata Seva ({event[5]}) is scheduled for tomorrow ({event[1]}).\n"
            f"May Lord Subramanya bless you and your family.\n"
            f"- Sri Subramanya Temple"
        )
        
        channel = event[7] or "WHATSAPP"
        
        # V1: Console output
        print(f"\n📱 [{channel}] → {event[4]}")
        print(f"   {message}")
        print(f"   ---")
        
        # Log to DB
        _log_communication(db, event[2], event[6], event_id,
                          "REMINDER", channel, event[4], message[:200])
        db.commit()
        
        return {"status": "SENT", "channel": channel, "to": event[4], "event_id": event_id}
    
    @staticmethod
    def send_delivery_check(db: Session, event_id: int) -> dict:
        """Send 'Did you receive Prasadam?' message 4 days after dispatch."""
        event = db.execute(text("""
            SELECT se.id, se.dispatch_date, 
                   d.id, d.full_name_en, d.phone_number,
                   sc.name_eng, ss.id, ss.communication_preference
            FROM shaswata_events se
            JOIN shaswata_subscriptions ss ON se.subscription_id = ss.id
            JOIN devotees d ON ss.devotee_id = d.id
            JOIN seva_catalog sc ON ss.seva_id = sc.id
            WHERE se.id = :eid
        """), {"eid": event_id}).fetchone()
        
        if not event:
            return {"status": "FAILED", "error": "Event not found"}
        
        message = (
            f"🙏 Namaste {event[3]}!\n"
            f"We dispatched Prasadam for your {event[5]} seva on {event[1]}.\n"
            f"Did you receive it?\n"
            f"Reply YES or NO.\n"
            f"If your address has changed, please update it.\n"
            f"- Sri Subramanya Temple"
        )
        
        channel = event[7] or "WHATSAPP"
        
        # V1: Console output
        print(f"\n📱 [{channel}] DELIVERY CHECK → {event[4]}")
        print(f"   {message}")
        print(f"   ---")
        
        _log_communication(db, event[2], event[6], event_id,
                          "DELIVERY_CHECK", channel, event[4], message[:200])
        db.commit()
        
        return {"status": "SENT", "channel": channel, "to": event[4], "event_id": event_id}
    
    @staticmethod
    def send_address_verification(db: Session, devotee_id: int, subscription_id: int = None) -> dict:
        """Send 'Please confirm your address' message 1 week before pooja."""
        devotee = db.execute(text("""
            SELECT id, full_name_en, phone_number, address, area, pincode
            FROM devotees WHERE id = :did
        """), {"did": devotee_id}).fetchone()
        
        if not devotee:
            return {"status": "FAILED", "error": "Devotee not found"}
        
        addr = f"{devotee[3] or ''}, {devotee[4] or ''} - {devotee[5] or ''}".strip(", -")
        message = (
            f"🙏 Namaste {devotee[1]}!\n"
            f"Your annual Shaswata Seva is coming up soon.\n"
            f"Current address: {addr}\n"
            f"Is this correct? Reply YES or send us your new address.\n"
            f"- Sri Subramanya Temple"
        )
        
        # V1: Console
        print(f"\n📱 [WHATSAPP] ADDRESS VERIFY → {devotee[2]}")
        print(f"   {message}")
        print(f"   ---")
        
        _log_communication(db, devotee_id, subscription_id, None,
                          "ADDRESS_VERIFY", "WHATSAPP", devotee[2], message[:200])
        db.commit()
        
        return {"status": "SENT", "channel": "WHATSAPP", "to": devotee[2]}


# =============================================================================
# 5. INTERNAL HELPERS
# =============================================================================

def _log_communication(db: Session, devotee_id: int, subscription_id: int, 
                       event_id: int, message_type: str, channel: str,
                       phone: str, preview: str, status: str = "SENT",
                       sent_by: int = None):
    """Insert a record into communication_logs for audit trail."""
    db.execute(text("""
        INSERT INTO communication_logs 
            (devotee_id, subscription_id, event_id, message_type, channel, 
             recipient_phone, status, message_preview, sent_by_user_id)
        VALUES (:did, :sid, :eid, :type, :chan, :phone, :status, :preview, :sent_by)
    """), {
        "did": devotee_id, "sid": subscription_id, "eid": event_id,
        "type": message_type, "chan": channel, "phone": phone,
        "status": status, "preview": preview[:200] if preview else None,
        "sent_by": sent_by
    })


def get_communication_history(db: Session, devotee_id: int = None, 
                               subscription_id: int = None, limit: int = 50) -> list:
    """Get message history for a devotee or subscription."""
    where_clauses = ["1=1"]
    params = {"lim": limit}
    
    if devotee_id:
        where_clauses.append("cl.devotee_id = :did")
        params["did"] = devotee_id
    if subscription_id:
        where_clauses.append("cl.subscription_id = :sid")
        params["sid"] = subscription_id
    
    where = " AND ".join(where_clauses)
    
    result = db.execute(text(f"""
        SELECT cl.id, cl.message_type, cl.channel, cl.recipient_phone, 
               cl.status, cl.message_preview, cl.sent_at, cl.sent_by_user_id,
               d.full_name_en
        FROM communication_logs cl
        JOIN devotees d ON cl.devotee_id = d.id
        WHERE {where}
        ORDER BY cl.sent_at DESC
        LIMIT :lim
    """), params).fetchall()
    
    return [{
        "id": row[0],
        "type": row[1],
        "channel": row[2],
        "phone": row[3],
        "status": row[4],
        "preview": row[5],
        "sent_at": str(row[6]) if row[6] else None,
        "sent_by": row[7],
        "devotee_name": row[8]
    } for row in result]
