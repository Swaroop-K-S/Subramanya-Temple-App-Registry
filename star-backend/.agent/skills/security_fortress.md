# Security Fortress Rules
---
description: Security and authentication rules for protecting the temple backend from attacks
---

## Input Hygiene (Pydantic)
ALL Pydantic models MUST sanitize inputs:
```python
class DevoteeCreate(BaseModel):
    name: str = Field(..., strip_whitespace=True, min_length=2, max_length=100)
    phone: str = Field(..., pattern=r'^[0-9]{10}$')
    
    class Config:
        str_strip_whitespace = True
```

## SQL Injection Prevention
```python
# ❌ FORBIDDEN - SQL Injection vulnerability
query = f"SELECT * FROM devotees WHERE phone = '{phone}'"

# ✅ MANDATORY - Parameter binding
query = text("SELECT * FROM devotees WHERE phone = :phone")
result = await db.execute(query, {"phone": phone})
```

## Rate Limiting
Login/sensitive endpoints MUST have rate limits:
```python
@limiter.limit("5/minute")
@app.post("/auth/login")
async def login(credentials: LoginRequest):
    ...
```

## Password Hashing
```python
# ❌ FORBIDDEN
hashlib.md5(password)  # Crackable in seconds

# ✅ MANDATORY - Argon2
from passlib.hash import argon2
hashed = argon2.hash(password)
```

## JWT Standards
- Access tokens: 15 minutes max
- Refresh tokens: 7 days max
- ALWAYS verify signature and expiry

## CORS Configuration
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://yourtemple.com"],  # NOT "*"
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
)
```

## Secrets Management
```python
# ❌ FORBIDDEN
DATABASE_URL = "postgresql://admin:password123@localhost/db"

# ✅ MANDATORY
DATABASE_URL = os.getenv("DATABASE_URL")
```

## Audit Logging
Log ALL sensitive operations:
```python
logger.info(f"User {user_id} cancelled booking {booking_id} at {datetime.utcnow()}")
```
