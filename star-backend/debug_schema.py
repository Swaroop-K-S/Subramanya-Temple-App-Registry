from pydantic import BaseModel, Field, field_validator, model_validator, ValidationError
from typing import Optional
from enum import Enum

class Tithi(str, Enum):
    PANCHAMI = "Panchami"

class ShaswataCreateTest(BaseModel):
    tithi: Optional[Tithi] = Field(None)

    @field_validator('tithi', mode='before')
    @classmethod
    def convert_tithi_int(cls, v):
        print(f"DEBUG: Validator called with value={v} type={type(v)}")
        if isinstance(v, int):
            return Tithi.PANCHAMI # Mock conversion
        return v

try:
    print("Testing Integer Input:")
    obj = ShaswataCreateTest(tithi=5)
    print(f"Success: {obj.tithi}")
except ValidationError as e:
    print(f"Validation Error: {e}")
except Exception as e:
    print(f"Error: {e}")
