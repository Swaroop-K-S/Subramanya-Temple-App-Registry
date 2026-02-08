# Database Integrity Rules (The Iron Bank)
---
description: Database integrity and data protection rules for all backend/DB operations
---

## ACID Compliance
All booking operations MUST be wrapped in a transaction:
```python
async with db.begin():
    # All operations here commit together or rollback together
    booking = create_booking(...)
    payment = create_payment(...)
```

## Soft Deletes - NEVER Hard Delete
```python
# ❌ FORBIDDEN
DELETE FROM bookings WHERE id = 123

# ✅ MANDATORY  
UPDATE bookings SET is_active = false, deleted_at = NOW() WHERE id = 123
```

## Indexing Rules
- All foreign keys MUST be indexed
- Frequently searched columns (`phone_number`, `booking_date`, `devotee_id`) MUST have B-Tree indexes
- Composite indexes for common WHERE clause combinations

## N+1 Query Prevention
```python
# ❌ BAD - 100 bookings = 100 queries
for booking in bookings:
    devotee = await get_devotee(booking.devotee_id)

# ✅ GOOD - 1 query with JOIN
bookings = await db.execute(
    select(Booking).options(selectinload(Booking.devotee))
)
```

## Migration Safety
- ALWAYS use Alembic for schema changes
- NEVER modify tables directly in production
- Test migrations on a copy of production data first

## Connection Pooling
```python
engine = create_async_engine(
    DATABASE_URL,
    pool_size=20,
    max_overflow=10,
    pool_timeout=30
)
```
