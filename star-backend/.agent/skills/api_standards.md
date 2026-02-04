# API Standards (The Architect)
---
description: RESTful API design standards for consistent, maintainable endpoints
---

## Response Envelope Format
ALL responses MUST follow this structure:
```json
{
    "data": { ... },
    "meta": {
        "total": 100,
        "page": 1,
        "limit": 20
    }
}
```

## RESTful URL Patterns
```python
# ❌ BAD URLs
GET  /getAllSevas
POST /create-new-booking
GET  /fetch-devotee-by-phone

# ✅ GOOD URLs (Resource-based)
GET    /sevas              # List all sevas
POST   /bookings           # Create booking
GET    /devotees/{id}      # Get devotee by ID
PUT    /bookings/{id}      # Update booking
DELETE /bookings/{id}      # Soft-delete booking
```

## HTTP Status Codes
| Code | Meaning | When to Use |
|------|---------|-------------|
| 200 | OK | Successful GET/PUT |
| 201 | Created | Successful POST |
| 204 | No Content | Successful DELETE |
| 400 | Bad Request | Malformed JSON |
| 401 | Unauthorized | Missing/invalid token |
| 403 | Forbidden | Valid token, no permission |
| 404 | Not Found | Resource doesn't exist |
| 422 | Unprocessable | Validation failed |
| 429 | Too Many Requests | Rate limited |
| 500 | Server Error | Unhandled exception |

## Date/Time Standards
ALL timestamps MUST be ISO 8601 UTC:
```python
# ❌ BAD
"date": "04-02-2026"
"time": "3:30 PM IST"

# ✅ GOOD (ISO 8601 UTC)
"created_at": "2026-02-04T10:00:00Z"
"booking_date": "2026-02-04"
```

## API Versioning
```python
app.include_router(v1_router, prefix="/api/v1")
app.include_router(v2_router, prefix="/api/v2")  # For breaking changes
```

## Health Check Endpoint
```python
@app.get("/health")
async def health_check():
    return {"status": "healthy", "db": "connected", "version": "1.0.0"}
```

## OpenAPI Documentation
FastAPI auto-generates docs at:
- Swagger UI: `/docs`
- ReDoc: `/redoc`
