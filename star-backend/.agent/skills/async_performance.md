# Async Performance Rules (The Speed Force)
---
description: Performance optimization rules for sub-100ms API responses
---

## Non-Blocking Database Calls
ALL database operations MUST use async/await:
```python
# ❌ BLOCKING - Freezes the entire server
result = db.execute(query)

# ✅ NON-BLOCKING
result = await db.execute(query)
```

## N+1 Query Prevention
Use eager loading for related data:
```python
# ✅ Fetch bookings with devotee in ONE query
bookings = await db.execute(
    select(Booking)
    .options(selectinload(Booking.devotee))
    .options(selectinload(Booking.seva))
)
```

## Redis Caching
Cache read-heavy data (Panchangam, Seva list):
```python
@cached(ttl=3600, key="panchangam:{date}")
async def get_panchangam(date: str):
    # This result is cached for 1 hour
    return await calculate_panchangam(date)
```

## Pagination - ALWAYS
```python
# ❌ FORBIDDEN - Returns 50,000 records
@app.get("/bookings")
async def get_all_bookings():
    return await db.execute(select(Booking))

# ✅ MANDATORY - Paginated
@app.get("/bookings")
async def get_bookings(page: int = 1, limit: int = 20):
    offset = (page - 1) * limit
    return await db.execute(
        select(Booking).offset(offset).limit(limit)
    )
```

## Background Tasks
Offload heavy operations (emails, PDFs, reports):
```python
from fastapi import BackgroundTasks

@app.post("/bookings")
async def create_booking(data: BookingCreate, bg: BackgroundTasks):
    booking = await save_booking(data)
    bg.add_task(send_confirmation_email, booking.id)
    bg.add_task(generate_receipt_pdf, booking.id)
    return booking
```

## Response Compression
Enable Gzip for large responses:
```python
from fastapi.middleware.gzip import GZipMiddleware
app.add_middleware(GZipMiddleware, minimum_size=1000)
```

## Query Optimization
Always check slow queries with EXPLAIN ANALYZE:
```sql
EXPLAIN ANALYZE SELECT * FROM bookings WHERE date = '2026-02-04';
```
