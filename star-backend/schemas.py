"""
S.T.A.R. Backend - Pydantic Schemas
====================================
Request and response models for API validation.
"""

from pydantic import BaseModel, Field, model_validator
from typing import Optional
from decimal import Decimal
from enum import Enum


# =============================================================================
# ENUM DEFINITIONS
# =============================================================================

class PaymentMode(str, Enum):
    """Payment modes accepted at the temple"""
    CASH = "CASH"
    UPI = "UPI"


class SubscriptionType(str, Enum):
    """Type of date tracking for Shaswata subscription"""
    LUNAR = "LUNAR"           # Based on Hindu Panchanga
    GREGORIAN = "GREGORIAN"   # Based on fixed calendar date


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
    """Schema for creating a new seva booking/transaction"""
    devotee_name: str = Field(..., min_length=2, max_length=150, description="Full name of the devotee")
    phone_number: str = Field(..., min_length=10, max_length=15, description="Contact phone number")
    gothra: Optional[str] = Field(None, max_length=50, description="Gotra (ancestral lineage)")
    nakshatra: Optional[str] = Field(None, max_length=30, description="Birth star")
    rashi: Optional[str] = Field(None, max_length=30, description="Zodiac sign")
    seva_id: int = Field(..., gt=0, description="ID of the seva being booked")
    amount: float = Field(..., gt=0, description="Amount paid for the seva")
    payment_mode: PaymentMode = Field(..., description="Payment method: CASH or UPI")

    class Config:
        json_schema_extra = {
            "example": {
                "devotee_name": "Ramesh Kumar",
                "phone_number": "9876543210",
                "gothra": "Kashyapa",
                "nakshatra": "Ashwini",
                "seva_id": 1,
                "amount": 20.00,
                "payment_mode": "CASH"
            }
        }


class DevoteeCreate(BaseModel):
    """Schema for creating a new devotee profile"""
    full_name: str = Field(..., min_length=2, max_length=150)
    phone_number: str = Field(..., min_length=10, max_length=15)
    gothra: Optional[str] = None
    nakshatra: Optional[str] = None
    rashi: Optional[str] = None
    address: Optional[str] = None


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
    
    # Seva Information
    seva_id: int = Field(..., gt=0, description="ID of the Shaswata seva (usually 7 or 8)")
    amount: float = Field(..., gt=0, description="Subscription amount paid")
    payment_mode: PaymentMode = Field(..., description="Payment method")
    
    # Subscription Type
    subscription_type: SubscriptionType = Field(..., description="LUNAR or GREGORIAN")
    
    # Gregorian Fields (for birthdays/fixed dates)
    event_day: Optional[int] = Field(None, ge=1, le=31, description="Day of month (1-31)")
    event_month: Optional[int] = Field(None, ge=1, le=12, description="Month (1-12)")
    
    # Lunar Fields (for Hindu Panchanga dates)
    maasa: Optional[Maasa] = Field(None, description="Hindu lunar month")
    paksha: Optional[Paksha] = Field(None, description="Shukla or Krishna paksha")
    tithi: Optional[Tithi] = Field(None, description="Lunar day/tithi")
    
    # Additional Info
    notes: Optional[str] = Field(None, max_length=500, description="Additional notes")

    @model_validator(mode='after')
    def validate_date_fields(self):
        """Validate that appropriate fields are provided based on subscription type"""
        if self.subscription_type == SubscriptionType.LUNAR:
            if not all([self.maasa, self.paksha, self.tithi]):
                raise ValueError(
                    "For LUNAR subscription, maasa, paksha, and tithi are required. "
                    "Example: maasa='Chaitra', paksha='Shukla', tithi='Panchami'"
                )
        elif self.subscription_type == SubscriptionType.GREGORIAN:
            if not all([self.event_day, self.event_month]):
                raise ValueError(
                    "For GREGORIAN subscription, event_day and event_month are required. "
                    "Example: event_day=15, event_month=8 (for August 15th)"
                )
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

    class Config:
        from_attributes = True


class DevoteeResponse(BaseModel):
    """Response schema for devotee information"""
    id: int
    full_name: str
    phone_number: Optional[str] = None
    gothra: Optional[str] = None
    nakshatra: Optional[str] = None

    class Config:
        from_attributes = True


class ShaswataSubscriptionResponse(BaseModel):
    """Response schema after successful Shaswata subscription"""
    subscription_id: int
    devotee_name: str
    seva_name: str
    subscription_type: str
    lunar_date: Optional[str] = None      # e.g., "Chaitra Shukla Panchami"
    gregorian_date: Optional[str] = None  # e.g., "December 25"
    amount_paid: float
    message: str

    class Config:
        from_attributes = True

