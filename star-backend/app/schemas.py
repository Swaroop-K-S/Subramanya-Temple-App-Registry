"""
S.T.A.R. Backend - Pydantic Schemas
====================================
Request and response models for API validation.
"""

from pydantic import BaseModel, Field, model_validator, field_validator
from typing import Optional
from decimal import Decimal
from enum import Enum
from datetime import date, datetime


# =============================================================================
# ENUM DEFINITIONS
# =============================================================================

class PaymentMode(str, Enum):
    """Payment modes accepted at the temple"""
    CASH = "CASH"
    UPI = "UPI"
    CHEQUE = "CHEQUE"
    NEFT = "NEFT"
    RTGS = "RTGS"


class SubscriptionType(str, Enum):
    """Type of date tracking for Shaswata subscription"""
    LUNAR = "LUNAR"           # Based on Hindu Panchanga
    GREGORIAN = "GREGORIAN"   # Based on fixed calendar date
    RATHOTSAVA = "RATHOTSAVA" # Fixed annual temple festival (no date needed)


class SevaType(str, Enum):
    """Type of Shaswata Puja"""
    GENERAL = "GENERAL"           # General Shaswata Pooja
    BRAHMACHARI = "BRAHMACHARI"   # Brahmachari Pooja (Rathotsava)


class Maasa(str, Enum):
    """12 Hindu Lunar Months"""
    CHAITRA = "Chaitra"
    VAISHAKHA = "Vaishakha"
    JYESHTHA = "Jyeshtha"
    ASHADHA = "Ashadha"
    SHRAVANA = "Shravana"
    BHADRAPADA = "Bhadrapada"
    ASHWINA = "Ashwina"
    KARTIKA = "Kartika"
    MARGASHIRSHA = "Margashirsha"
    PAUSHA = "Pausha"
    MAGHA = "Magha"
    PHALGUNA = "Phalguna"


class Paksha(str, Enum):
    """Lunar Fortnight"""
    SHUKLA = "Shukla"   # Bright/Waxing
    KRISHNA = "Krishna" # Dark/Waning


class Tithi(str, Enum):
    """Lunar Days (Tithis)"""
    PRATIPADA = "Pratipada"
    DWITIYA = "Dwitiya"
    TRITIYA = "Tritiya"
    CHATURTHI = "Chaturthi"
    PANCHAMI = "Panchami"
    SHASHTHI = "Shashthi"
    SAPTAMI = "Saptami"
    ASHTAMI = "Ashtami"
    NAVAMI = "Navami"
    DASHAMI = "Dashami"
    EKADASHI = "Ekadashi"
    DWADASHI = "Dwadashi"
    TRAYODASHI = "Trayodashi"
    CHATURDASHI = "Chaturdashi"
    PURNIMA = "Purnima"       # Full Moon
    AMAVASYA = "Amavasya"     # New Moon


# =============================================================================
# Request Schemas (for receiving data)
# =============================================================================

class TransactionCreate(BaseModel):
    """Schema for creating a new seva booking/transaction (bilingual support)"""
    # Bilingual Name Fields
    devotee_name: str = Field(..., min_length=2, max_length=150, description="Primary display name (backward compat)")
    devotee_name_en: Optional[str] = Field(None, max_length=150, description="English name")
    devotee_name_kn: Optional[str] = Field(None, description="Kannada name (ಕನ್ನಡ)")
    
    phone_number: str = Field(..., min_length=10, max_length=15, description="Contact phone number")
    
    # Address Details
    area: Optional[str] = Field(None, max_length=100, description="Area/Locality")
    pincode: Optional[str] = Field(None, max_length=10, description="Pincode")
    
    # Bilingual Gothra Fields
    gothra: Optional[str] = Field(None, max_length=50, description="Gotra (backward compat)")
    gothra_en: Optional[str] = Field(None, max_length=50, description="English Gothra")
    gothra_kn: Optional[str] = Field(None, description="Kannada Gothra")
    
    nakshatra: Optional[str] = Field(None, max_length=30, description="Birth star")
    rashi: Optional[str] = Field(None, max_length=30, description="Zodiac sign")
    seva_id: int = Field(..., gt=0, description="ID of the seva being booked")
    amount: float = Field(..., gt=0, description="Amount paid for the seva")
    payment_mode: PaymentMode = Field(..., description="Payment method: CASH or UPI")
    seva_date: Optional[date] = Field(None, description="Date when seva should be performed. Defaults to today.")
    
    # UPI Transaction ID (required when payment_mode is UPI)
    upi_transaction_id: Optional[str] = Field(None, max_length=50, description="UPI Transaction Reference ID")

    @model_validator(mode='after')
    def validate_upi_transaction_id(self):
        """Validate that UPI transaction ID is provided when payment mode is UPI"""
        if self.payment_mode == PaymentMode.UPI:
            if not self.upi_transaction_id or not self.upi_transaction_id.strip():
                raise ValueError("UPI Transaction ID is required when payment mode is UPI")
        return self

    class Config:
        json_schema_extra = {
            "example": {
                "devotee_name": "Ramesh Kumar",
                "devotee_name_en": "Ramesh Kumar",
                "devotee_name_kn": "ರಮೇಶ್ ಕುಮಾರ್",
                "phone_number": "9876543210",
                "gothra": "Kashyapa",
                "gothra_en": "Kashyapa",
                "gothra_kn": "ಕಶ್ಯಪ",
                "nakshatra": "Ashwini",
                "seva_id": 1,
                "amount": 20.00,
                "payment_mode": "UPI",
                "upi_transaction_id": "UPI123456789"
            }
        }


class DevoteeCreate(BaseModel):
    """Schema for creating a new devotee profile"""
    full_name_en: str = Field(..., min_length=2, max_length=150, description="English Name")
    full_name_kn: Optional[str] = Field(None, description="Kannada Name (ಕನ್ನಡ)")
    phone_number: str = Field(..., min_length=10, max_length=15)
    gothra_en: Optional[str] = Field(None, description="English Gothra")
    gothra_kn: Optional[str] = Field(None, description="Kannada Gothra")
    nakshatra: Optional[str] = None
    rashi: Optional[str] = None
    address: Optional[str] = None
    area: Optional[str] = None
    pincode: Optional[str] = None


class ShaswataCreate(BaseModel):
    """
    Schema for creating a Shaswata (Perpetual) Puja subscription.
    
    Validation Rules:
    - If type is LUNAR: maasa, paksha, and tithi are REQUIRED
    - If type is GREGORIAN: event_day and event_month are REQUIRED
    """
    # Devotee Information
    devotee_name: str = Field(..., min_length=2, max_length=150, description="Full name of the devotee")
    phone_number: str = Field(..., min_length=10, max_length=15, description="Contact phone number")
    gothra: Optional[str] = Field(None, max_length=50, description="Gotra")
    nakshatra: Optional[str] = Field(None, max_length=30, description="Birth star")
    rashi: Optional[str] = Field(None, max_length=30, description="Zodiac sign")
    address: Optional[str] = Field(None, description="Postal address")
    area: Optional[str] = Field(None, max_length=100, description="Area/Locality")
    pincode: Optional[str] = Field(None, max_length=10, description="Pincode")
    
    # Seva Information
    seva_id: Optional[int] = Field(None, description="ID of the Shaswata seva")
    amount: Optional[float] = Field(None, description="Subscription amount paid")
    payment_mode: Optional[PaymentMode] = Field(None, description="Payment method")
    
    # Subscription & Seva Type
    subscription_type: SubscriptionType = Field(..., description="LUNAR, GREGORIAN, or RATHOTSAVA")
    seva_type: Optional[str] = Field("GENERAL", description="GENERAL or BRAHMACHARI")
    
    # Gregorian Fields (for birthdays/fixed dates)
    event_day: Optional[int] = Field(None, ge=1, le=31, description="Day of month (1-31)")
    event_month: Optional[int] = Field(None, ge=1, le=12, description="Month (1-12)")
    
    # Lunar Fields (for Hindu Panchanga dates)
    maasa: Optional[Maasa] = Field(None, description="Hindu lunar month")
    paksha: Optional[Paksha] = Field(None, description="Shukla or Krishna paksha")
    tithi: Optional[Tithi] = Field(None, description="Lunar day/tithi")
    
    # Occasion Field (NEW: Birthday, Anniversary, etc.)
    occasion: Optional[str] = Field(None, max_length=100, description="Purpose: Birthday, Anniversary, etc.")
    
    # Additional Info
    notes: Optional[str] = Field(None, max_length=500, description="Additional notes")
    
    # UPI Transaction ID (required when payment_mode is UPI)
    upi_transaction_id: Optional[str] = Field(None, max_length=50, description="UPI Transaction Reference ID")

    @field_validator('tithi', mode='before')
    @classmethod
    def convert_tithi_int(cls, v):
        """Allow integer input for tithi and convert to Enum"""
        # If it's a string digit (e.g. "5"), convert to int
        if isinstance(v, str) and v.isdigit():
            v = int(v)
            
        if isinstance(v, int):
            try:
                # 1-based index to Enum list
                tithi_list = list(Tithi)
                if 1 <= v <= len(tithi_list):
                    return tithi_list[v-1]
                raise ValueError(f"Tithi integer must be between 1 and {len(tithi_list)}")
            except IndexError:
                raise ValueError("Invalid tithi integer")
        return v

    @model_validator(mode='after')
    def validate_date_fields(self):
        """Validate that appropriate fields are provided based on subscription type"""
        if self.subscription_type == SubscriptionType.LUNAR:
            if not all([self.maasa, self.paksha, self.tithi]):
                raise ValueError(
                    "For LUNAR subscription, maasa, paksha, and tithi are required."
                )
        elif self.subscription_type == SubscriptionType.GREGORIAN:
            if not all([self.event_day, self.event_month]):
                raise ValueError(
                    "For GREGORIAN subscription, event_day and event_month are required."
                )
        # RATHOTSAVA type does not require any date fields
        
        # Validate UPI Transaction ID
        if self.payment_mode == PaymentMode.UPI:
            if not self.upi_transaction_id or not self.upi_transaction_id.strip():
                raise ValueError("UPI Transaction ID is required when payment mode is UPI")
        
        return self

    class Config:
        json_schema_extra = {
            "examples": [
                {
                    "title": "Lunar Subscription (Tithi-based)",
                    "value": {
                        "devotee_name": "Suresh Sharma",
                        "phone_number": "9876543210",
                        "gothra": "Bharadwaja",
                        "seva_id": 7,
                        "amount": 5000.00,
                        "payment_mode": "UPI",
                        "subscription_type": "LUNAR",
                        "maasa": "Chaitra",
                        "paksha": "Shukla",
                        "tithi": "Panchami",
                        "notes": "Father's Shraddha"
                    }
                },
                {
                    "title": "Gregorian Subscription (Birthday)",
                    "value": {
                        "devotee_name": "Lakshmi Devi",
                        "phone_number": "9988776655",
                        "seva_id": 7,
                        "amount": 5000.00,
                        "payment_mode": "CASH",
                        "subscription_type": "GREGORIAN",
                        "event_day": 25,
                        "event_month": 12,
                        "notes": "Birthday puja"
                    }
                }
            ]
        }


# =============================================================================
# Response Schemas (for sending data)
# =============================================================================

class SevaResponse(BaseModel):
    """Response schema for Seva catalog items"""
    id: int
    name_eng: str
    name_kan: Optional[str] = None
    price: Decimal
    is_shaswata: bool
    is_slot_based: bool
    daily_limit: Optional[int] = None
    is_active: bool

    class Config:
        from_attributes = True


class TransactionResponse(BaseModel):
    """Response schema after successful booking"""
    transaction_id: int
    receipt_no: str
    devotee_name: str
    seva_name: str
    amount_paid: float
    payment_mode: str
    message: str
    seva_date: Optional[date] = None
    nakshatra: Optional[str] = None
    rashi: Optional[str] = None
    gothra: Optional[str] = None
    gothra_en: Optional[str] = None
    gothra_kn: Optional[str] = None

    class Config:
        from_attributes = True


class DevoteeResponse(BaseModel):
    """Response schema for devotee information (bilingual)"""
    id: int
    full_name_en: str = Field(..., alias="full_name")  # Alias for backward compat
    full_name_kn: Optional[str] = None
    phone_number: Optional[str] = None
    gothra_en: Optional[str] = Field(None, alias="gothra")
    gothra_kn: Optional[str] = None
    nakshatra: Optional[str] = None
    rashi: Optional[str] = None
    area: Optional[str] = None
    pincode: Optional[str] = None

    class Config:
        from_attributes = True


class ShaswataSubscriptionResponse(BaseModel):
    """Response schema after successful Shaswata subscription"""
    subscription_id: int
    devotee_name: str
    seva_name: Optional[str] = None
    subscription_type: str
    seva_type: Optional[str] = None
    lunar_date: Optional[str] = None      # e.g., "Chaitra Shukla Panchami"
    gregorian_date: Optional[str] = None  # e.g., "December 25"
    is_active: bool = True
    message: str

    class Config:
        from_attributes = True


# =============================================================================
# Auth Schemas
# =============================================================================

class UserBase(BaseModel):
    username: str

class UserCreate(UserBase):
    password: str
    role: str = "admin"

class UserLogin(UserBase):
    username: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

class UserResponse(BaseModel):
    """Response schema for user data (excludes password)"""
    id: int
    username: str
    role: str
    is_active: bool = True
    created_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

