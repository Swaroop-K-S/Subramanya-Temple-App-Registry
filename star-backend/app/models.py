"""
S.T.A.R. Backend - SQLAlchemy ORM Models
=========================================
Defines the database models matching the PostgreSQL schema.
"""

from sqlalchemy import Column, Integer, String, Boolean, Numeric, DateTime, Date, ForeignKey, Text, Enum as SQLEnum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .database import Base
import enum


# =============================================================================
# ENUM DEFINITIONS - Hindu Calendar
# =============================================================================

class SubscriptionType(str, enum.Enum):
    """Type of date tracking for Shaswata subscription"""
    LUNAR = "LUNAR"           # Based on Hindu Panchanga (Tithi)
    GREGORIAN = "GREGORIAN"   # Based on fixed calendar date (Birthday)
    RATHOTSAVA = "RATHOTSAVA" # Fixed annual temple festival


class Maasa(str, enum.Enum):
    """12 Hindu Lunar Months (Masa)"""
    CHAITRA = "Chaitra"           # March-April (चैत्र)
    VAISHAKHA = "Vaishakha"       # April-May (वैशाख)
    JYESHTHA = "Jyeshtha"         # May-June (ज्येष्ठ)
    ASHADHA = "Ashadha"           # June-July (आषाढ)
    SHRAVANA = "Shravana"         # July-August (श्रावण)
    BHADRAPADA = "Bhadrapada"     # August-September (भाद्रपद)
    ASHWINA = "Ashwina"           # September-October (आश्विन)
    KARTIKA = "Kartika"           # October-November (कार्तिक)
    MARGASHIRSHA = "Margashirsha" # November-December (मार्गशीर्ष)
    PAUSHA = "Pausha"             # December-January (पौष)
    MAGHA = "Magha"               # January-February (माघ)
    PHALGUNA = "Phalguna"         # February-March (फाल्गुन)


class Paksha(str, enum.Enum):
    """Lunar Fortnight - 15 days each"""
    SHUKLA = "Shukla"   # Bright/Waxing fortnight (शुक्ल पक्ष)
    KRISHNA = "Krishna" # Dark/Waning fortnight (कृष्ण पक्ष)


class Tithi(str, enum.Enum):
    """30 Tithis (Lunar Days) - 15 per Paksha"""
    PRATIPADA = "Pratipada"       # 1st day (प्रतिपदा)
    DWITIYA = "Dwitiya"           # 2nd day (द्वितीया)
    TRITIYA = "Tritiya"           # 3rd day (तृतीया)
    CHATURTHI = "Chaturthi"       # 4th day (चतुर्थी)
    PANCHAMI = "Panchami"         # 5th day (पंचमी)
    SHASHTHI = "Shashthi"         # 6th day (षष्ठी)
    SAPTAMI = "Saptami"           # 7th day (सप्तमी)
    ASHTAMI = "Ashtami"           # 8th day (अष्टमी)
    NAVAMI = "Navami"             # 9th day (नवमी)
    DASHAMI = "Dashami"           # 10th day (दशमी)
    EKADASHI = "Ekadashi"         # 11th day (एकादशी)
    DWADASHI = "Dwadashi"         # 12th day (द्वादशी)
    TRAYODASHI = "Trayodashi"     # 13th day (त्रयोदशी)
    CHATURDASHI = "Chaturdashi"   # 14th day (चतुर्दशी)
    PURNIMA = "Purnima"           # Full Moon - 15th of Shukla (पूर्णिमा)
    AMAVASYA = "Amavasya"         # New Moon - 15th of Krishna (अमावस्या)


class Nakshatra(str, enum.Enum):
    """27 Nakshatras (Birth Stars)"""
    ASHWINI = "Ashwini"
    BHARANI = "Bharani"
    KRITTIKA = "Krittika"
    ROHINI = "Rohini"
    MRIGASHIRA = "Mrigashira"
    ARDRA = "Ardra"
    PUNARVASU = "Punarvasu"
    PUSHYA = "Pushya"
    ASHLESHA = "Ashlesha"
    MAGHA_NAK = "Magha"
    PURVA_PHALGUNI = "Purva Phalguni"
    UTTARA_PHALGUNI = "Uttara Phalguni"
    HASTA = "Hasta"
    CHITRA = "Chitra"
    SWATI = "Swati"
    VISHAKHA = "Vishakha"
    ANURADHA = "Anuradha"
    JYESHTHA_NAK = "Jyeshtha"
    MOOLA = "Moola"
    PURVA_ASHADHA = "Purva Ashadha"
    UTTARA_ASHADHA = "Uttara Ashadha"
    SHRAVANA_NAK = "Shravana"
    DHANISHTA = "Dhanishta"
    SHATABHISHA = "Shatabhisha"
    PURVA_BHADRAPADA = "Purva Bhadrapada"
    UTTARA_BHADRAPADA = "Uttara Bhadrapada"
    REVATI = "Revati"


# =============================================================================
# ORM MODELS
# =============================================================================

class SevaCatalog(Base):
    """
    ORM Model for the seva_catalog table.
    Represents the master list of 14 seva/receipt types offered at the temple.
    """
    __tablename__ = "seva_catalog"

    id = Column(Integer, primary_key=True, index=True)
    name_eng = Column(String(100), nullable=False, unique=True)  # English name
    name_kan = Column(String(100), nullable=True)                 # Kannada name (ಕನ್ನಡ)
    price = Column(Numeric(10, 2), nullable=False, default=0.00)
    is_shaswata = Column(Boolean, default=False)    # TRUE for recurring annual Pooja
    is_slot_based = Column(Boolean, default=False)  # TRUE for sevas requiring slot booking
    daily_limit = Column(Integer, nullable=True)    # NULL = unlimited
    
    # Audit columns
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    is_active = Column(Boolean, default=True)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    def __repr__(self):
        return f"<SevaCatalog(id={self.id}, name='{self.name_eng}', price={self.price})>"


class Devotee(Base):
    """
    ORM Model for the devotees table.
    Stores devotee profiles for quick lookup and booking.
    """
    __tablename__ = "devotees"

    id = Column(Integer, primary_key=True, index=True)
    full_name_en = Column(String(150), nullable=False)  # English Name
    full_name_kn = Column(Text, nullable=True)          # Kannada Name (ಕನ್ನಡ)
    phone_number = Column(String(15), unique=True, nullable=True)
    gothra_en = Column(String(50), nullable=True)       # English Gothra
    gothra_kn = Column(Text, nullable=True)             # Kannada Gothra
    nakshatra = Column(String(30), nullable=True)
    rashi = Column(String(30), nullable=True)
    address = Column(Text, nullable=True)
    area = Column(String(100), nullable=True)           # NEW
    pincode = Column(String(10), nullable=True)         # NEW
    
    # Address Confirmation Tracking
    address_confirmed = Column(Boolean, default=False)
    address_confirmed_at = Column(DateTime(timezone=True), nullable=True)
    address_confirmation_sent_at = Column(DateTime(timezone=True), nullable=True)
    
    # Audit columns
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    is_active = Column(Boolean, default=True)
    history = Column(Text, nullable=True)                  # JSON string of past bookings
    
    # Sync Metadata
    synced = Column(Boolean, default=False)
    last_modified = Column(DateTime(timezone=True), default=func.now(), onupdate=func.now())

    # Relationships
    subscriptions = relationship("ShaswataSubscription", back_populates="devotee")
    transactions = relationship("Transaction", back_populates="devotee")

    def __repr__(self):
        return f"<Devotee(id={self.id}, name='{self.full_name_en}', phone='{self.phone_number}')>"


class ShaswataSubscription(Base):
    """
    ORM Model for shaswata_subscriptions table.
    Represents a perpetual/recurring puja subscription that is performed annually.
    
    Supports two date types:
    - LUNAR: Based on Hindu Panchanga (Maasa + Paksha + Tithi)
    - GREGORIAN: Based on fixed calendar date (for birthdays/anniversaries)
    """
    __tablename__ = "shaswata_subscriptions"

    id = Column(Integer, primary_key=True, index=True)
    
    # Foreign Keys
    devotee_id = Column(Integer, ForeignKey("devotees.id", ondelete="CASCADE"), nullable=False)
    seva_id = Column(Integer, ForeignKey("seva_catalog.id", ondelete="RESTRICT"), nullable=False)
    
    # Subscription Type: LUNAR, GREGORIAN, or RATHOTSAVA
    subscription_type = Column(String(20), nullable=False, default="LUNAR")
    
    # Seva Type: GENERAL or BRAHMACHARI
    seva_type = Column(String(20), nullable=True, default="GENERAL")
    
    # =========================================================================
    # GREGORIAN DATE FIELDS (For fixed birthdays/anniversaries)
    # =========================================================================
    event_day = Column(Integer, nullable=True)    # Day of month (1-31)
    event_month = Column(Integer, nullable=True)  # Month (1-12)
    
    # =========================================================================
    # LUNAR DATE FIELDS (For Hindu Panchanga-based events)
    # =========================================================================
    maasa = Column(String(30), nullable=True)     # Hindu month (Chaitra to Phalguna)
    paksha = Column(String(10), nullable=True)    # Shukla or Krishna
    tithi = Column(String(20), nullable=True)     # Lunar day (Pratipada to Purnima/Amavasya)
    nakshatra_trigger = Column(String(30), nullable=True)  # Optional: specific nakshatra
    
    # =========================================================================
    # TRACKING & METADATA
    # =========================================================================
    last_performed_year = Column(Integer, nullable=True)  # Year when last performed
    occasion = Column(String(100), nullable=True)          # NEW: Birthday, Anniversary, etc.
    notes = Column(Text, nullable=True)                   # Additional notes
    
    # Dispatch & Feedback Tracking
    last_dispatch_date = Column(Date, nullable=True)       # Date prasadam was last dispatched
    last_feedback_date = Column(Date, nullable=True)       # Date feedback was last sent
    
    # Communication & Address Verification (Phase 1 Upgrade)
    communication_preference = Column(String(20), default="WHATSAPP")  # WHATSAPP / SMS
    last_address_confirmed_at = Column(Date, nullable=True)            # Last address verification date
    
    # Audit columns
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    is_active = Column(Boolean, default=True)

    # Sync Metadata
    synced = Column(Boolean, default=False)
    last_modified = Column(DateTime(timezone=True), default=func.now(), onupdate=func.now())

    # Relationships
    devotee = relationship("Devotee", back_populates="subscriptions")
    seva = relationship("SevaCatalog")
    events = relationship("ShaswataEvent", back_populates="subscription", order_by="ShaswataEvent.scheduled_date.desc()")

    def __repr__(self):
        return f"<ShaswataSubscription(id={self.id}, devotee_id={self.devotee_id}, type='{self.subscription_type}')>"


class ShaswataEvent(Base):
    """
    Tracks each ANNUAL instance of a Shaswata Seva.
    One subscription → many events (one per year).
    
    Lifecycle: PENDING → COMPLETED → DISPATCHED → DELIVERED
    """
    __tablename__ = "shaswata_events"

    id = Column(Integer, primary_key=True, index=True)
    subscription_id = Column(Integer, ForeignKey("shaswata_subscriptions.id", ondelete="CASCADE"), nullable=False)
    
    # Scheduling
    scheduled_date = Column(Date, nullable=False)           # The exact date this year's seva is scheduled
    year = Column(Integer, nullable=False)                  # Calendar year (e.g., 2026)
    
    # Status Tracking
    status = Column(String(20), default="PENDING")          # PENDING | COMPLETED | DISPATCHED | DELIVERED
    pooja_completed_at = Column(DateTime(timezone=True), nullable=True)
    
    # Dispatch Tracking
    dispatch_date = Column(Date, nullable=True)             # When prasadam was sent
    dispatch_ref = Column(String(100), nullable=True)       # Courier tracking number
    dispatch_method = Column(String(30), nullable=True)     # POST / COURIER / HAND_DELIVERY
    
    # Delivery Feedback (4-day check)
    delivery_status = Column(String(20), nullable=True)     # RECEIVED | NOT_RECEIVED | ADDRESS_CHANGED
    delivery_checked_at = Column(Date, nullable=True)       # When we asked the devotee
    delivery_notes = Column(Text, nullable=True)            # Any follow-up notes
    
    # Audit
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    is_active = Column(Boolean, default=True)
    
    # Relationships
    subscription = relationship("ShaswataSubscription", back_populates="events")

    def __repr__(self):
        return f"<ShaswataEvent(id={self.id}, sub={self.subscription_id}, date={self.scheduled_date}, status='{self.status}')>"


class CommunicationLog(Base):
    """
    Audit trail for all messages sent to devotees.
    Tracks WhatsApp, SMS, and system notifications.
    """
    __tablename__ = "communication_logs"

    id = Column(Integer, primary_key=True, index=True)
    devotee_id = Column(Integer, ForeignKey("devotees.id", ondelete="CASCADE"), nullable=False)
    subscription_id = Column(Integer, ForeignKey("shaswata_subscriptions.id", ondelete="SET NULL"), nullable=True)
    event_id = Column(Integer, ForeignKey("shaswata_events.id", ondelete="SET NULL"), nullable=True)
    
    # Message Details
    message_type = Column(String(30), nullable=False)       # CERTIFICATE | REMINDER | DISPATCH | DELIVERY_CHECK | ADDRESS_VERIFY | BIRTHDAY
    channel = Column(String(20), nullable=False)            # WHATSAPP | SMS | EMAIL
    recipient_phone = Column(String(15), nullable=True)     # Phone number used
    
    # Status
    status = Column(String(20), default="SENT")             # SENT | DELIVERED | FAILED | PENDING
    error_message = Column(Text, nullable=True)             # Error details if failed
    
    # Content
    message_preview = Column(Text, nullable=True)           # First 200 chars of the message
    
    # Audit
    sent_at = Column(DateTime(timezone=True), server_default=func.now())
    sent_by_user_id = Column(Integer, nullable=True)        # Admin who triggered it (NULL = automated)

    # Relationships
    devotee = relationship("Devotee")

    def __repr__(self):
        return f"<CommunicationLog(id={self.id}, type='{self.message_type}', to={self.recipient_phone}, status='{self.status}')>"


class Transaction(Base):
    """
    ORM Model for transactions table.
    Records every single booking/payment.
    """
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    receipt_no = Column(String(50), unique=True, nullable=False)
    
    # Foreign Keys
    devotee_id = Column(Integer, ForeignKey("devotees.id"), nullable=False)
    seva_id = Column(Integer, ForeignKey("seva_catalog.id"), nullable=False)
    
    # Payment Details
    amount_paid = Column(Numeric(10, 2), nullable=False)
    payment_mode = Column(String(20), nullable=False) # CASH / UPI
    
    # Snapshot of data at time of booking
    devotee_name = Column(String(150), nullable=False) 
    
    # Dates
    transaction_date = Column(DateTime(timezone=True), server_default=func.now())
    seva_date = Column(Date, default=func.current_date(), nullable=True) # Date when seva is performed
    
    # Meta
    notes = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)
    
    # Sync Metadata
    synced = Column(Boolean, default=False)
    last_modified = Column(DateTime, default=func.now(), onupdate=func.now())
    created_by_user_id = Column(Integer, default=1)

    # Relationships
    devotee = relationship("Devotee")
    seva = relationship("SevaCatalog")

    def __repr__(self):
        return f"<Transaction(id={self.id}, receipt='{self.receipt_no}', amount={self.amount_paid})>"


class User(Base):
    """
    ORM Model for users (admins/clerks).
    """
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    hashed_password = Column(String(200), nullable=False)
    role = Column(String(20), default="admin", nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), default=func.now())

    def __repr__(self):
        return f"<User(id={self.id}, username='{self.username}', role='{self.role}')>"


class SystemSetting(Base):
    """
    Key-value store for application-wide configuration.
    Examples: printer_margin_top, default_dispatch_method, whatsapp_template_dispatch
    """
    __tablename__ = "system_settings"

    key = Column(String(100), primary_key=True)          # e.g. 'printer_margin_top'
    value = Column(Text, nullable=True)                   # e.g. '10'
    value_type = Column(String(20), default="STRING")     # STRING | INTEGER | BOOLEAN | JSON
    description = Column(String(255), nullable=True)      # Human-readable label
    category = Column(String(50), default="general")      # general | printing | dispatch | notifications
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    def __repr__(self):
        return f"<SystemSetting(key='{self.key}', value='{self.value}')>"


class AuditLog(Base):
    """
    Immutable audit trail for critical admin actions.
    Tracks who did what, when, and to which resource.
    """
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    username = Column(String(50), nullable=True)          # Denormalized for fast reads
    action = Column(String(50), nullable=False)           # CREATE | UPDATE | DELETE | LOGIN | BACKUP | RESTORE
    resource_type = Column(String(50), nullable=False)    # SEVA | USER | SETTING | DATABASE | SUBSCRIPTION
    resource_id = Column(String(50), nullable=True)       # ID of the affected resource
    details = Column(Text, nullable=True)                 # JSON string of old/new values or context
    ip_address = Column(String(45), nullable=True)        # Client IP (for future use)
    timestamp = Column(DateTime(timezone=True), server_default=func.now(), index=True)

    # Relationship
    user = relationship("User")

    def __repr__(self):
        return f"<AuditLog(id={self.id}, action='{self.action}', resource='{self.resource_type}')>"


class DailyPanchang(Base):
    """
    Cache table for daily Panchangam calculations.
    Pre-computed or lazily cached to ensure instant loading.
    """
    __tablename__ = "daily_panchang"

    date = Column(Date, primary_key=True, index=True)           # The date this panchang is for
    data_json = Column(Text, nullable=False)                     # Full JSON output from PanchangCalculator
    version = Column(Integer, default=1)                         # Bump when calculation logic changes → invalidates cache
    location_hash = Column(String(50), nullable=True)            # Hash of lat+lon used for this calculation
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    def __repr__(self):
        return f"<DailyPanchang(date='{self.date}', version={self.version})>"
