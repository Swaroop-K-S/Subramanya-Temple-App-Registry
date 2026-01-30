"""
S.T.A.R. Backend - SQLAlchemy ORM Models
=========================================
Defines the database models matching the PostgreSQL schema.
"""

from sqlalchemy import Column, Integer, String, Boolean, Numeric, DateTime, ForeignKey, Text, Enum as SQLEnum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base
import enum


# =============================================================================
# ENUM DEFINITIONS - Hindu Calendar
# =============================================================================

class SubscriptionType(str, enum.Enum):
    """Type of date tracking for Shaswata subscription"""
    LUNAR = "LUNAR"           # Based on Hindu Panchanga (Tithi)
    GREGORIAN = "GREGORIAN"   # Based on fixed calendar date (Birthday)


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

    def __repr__(self):
        return f"<SevaCatalog(id={self.id}, name='{self.name_eng}', price={self.price})>"


class Devotee(Base):
    """
    ORM Model for the devotees table.
    Stores devotee profiles for quick lookup and booking.
    """
    __tablename__ = "devotees"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String(150), nullable=False)
    phone_number = Column(String(15), unique=True, nullable=True)
    gothra = Column(String(50), nullable=True)
    nakshatra = Column(String(30), nullable=True)
    rashi = Column(String(30), nullable=True)
    address = Column(Text, nullable=True)
    
    # Audit columns
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    subscriptions = relationship("ShaswataSubscription", back_populates="devotee")

    def __repr__(self):
        return f"<Devotee(id={self.id}, name='{self.full_name}', phone='{self.phone_number}')>"


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
    
    # Subscription Type
    subscription_type = Column(String(20), nullable=False, default="LUNAR")  # LUNAR or GREGORIAN
    
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
    notes = Column(Text, nullable=True)                   # Additional notes
    
    # Audit columns
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    is_active = Column(Boolean, default=True)

    # Relationships
    devotee = relationship("Devotee", back_populates="subscriptions")
    seva = relationship("SevaCatalog")

    def __repr__(self):
        return f"<ShaswataSubscription(id={self.id}, devotee_id={self.devotee_id}, type='{self.subscription_type}')>"
