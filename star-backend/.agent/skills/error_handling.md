# Error Handling Rules
---
description: Graceful error handling and logging standards
---

## Never Expose Stack Traces
```python
# ❌ DANGEROUS - Exposes internal code paths
@app.exception_handler(Exception)
async def handle_error(request, exc):
    return JSONResponse({"error": str(exc), "trace": traceback.format_exc()})

# ✅ SAFE - Friendly message, internal logging
@app.exception_handler(Exception)
async def handle_error(request, exc):
    logger.error(f"Unhandled error: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"code": "INTERNAL_ERROR", "message": "Something went wrong. Please try again."}
    )
```

## Standardized Error Response Format
```json
{
    "code": "BOOKING_CONFLICT",
    "message": "This time slot is already booked.",
    "details": {
        "field": "booking_date",
        "value": "2026-02-04"
    }
}
```

## Custom Exception Classes
```python
class TempleException(Exception):
    def __init__(self, code: str, message: str, status_code: int = 400):
        self.code = code
        self.message = message
        self.status_code = status_code

class SevaFullException(TempleException):
    def __init__(self, seva_name: str):
        super().__init__(
            code="SEVA_FULL",
            message=f"The {seva_name} seva is fully booked for this date.",
            status_code=422
        )
```

## Logging Standards
```python
import logging

logger = logging.getLogger(__name__)

# Log levels:
logger.debug("Detailed debugging info")      # Development only
logger.info("User 123 booked Seva 456")      # Normal operations
logger.warning("Rate limit approaching")      # Potential issues
logger.error("Payment gateway timeout", exc_info=True)  # Failures
logger.critical("Database connection lost")  # System down
```

## Validation Error Handling
```python
from fastapi.exceptions import RequestValidationError

@app.exception_handler(RequestValidationError)
async def validation_handler(request, exc):
    errors = [
        {"field": err["loc"][-1], "message": err["msg"]}
        for err in exc.errors()
    ]
    return JSONResponse(
        status_code=422,
        content={"code": "VALIDATION_ERROR", "errors": errors}
    )
```

## Database Error Handling
```python
from sqlalchemy.exc import IntegrityError

try:
    await db.commit()
except IntegrityError as e:
    await db.rollback()
    if "duplicate key" in str(e):
        raise TempleException("DUPLICATE_ENTRY", "This record already exists.")
    raise
```
