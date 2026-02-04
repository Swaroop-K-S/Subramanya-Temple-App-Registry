# Backend Fortress - Skill Manifest
---
name: Backend Fortress
description: Comprehensive backend architecture rules for database, security, performance, API design, and error handling
---

## Overview
This skill set codifies the **5 Pillars of Backend Excellence** for the Subramanya Temple Management System. These rules MUST be followed for all backend and database operations.

## Skill Files

### 1. 🏦 [Database Integrity](./db_integrity.md) (The Iron Bank)
- ACID compliance & transactions
- Soft deletes (never hard delete)
- Indexing strategy
- N+1 query prevention
- Connection pooling

### 2. 🏰 [Security Fortress](./security_fortress.md)
- Input sanitization (Pydantic)
- SQL injection prevention
- Rate limiting
- Password hashing (Argon2)
- JWT standards
- CORS configuration

### 3. ⚡ [Async Performance](./async_performance.md) (The Speed Force)
- Non-blocking async/await
- Redis caching
- Pagination (always!)
- Background tasks
- Query optimization

### 4. 🏛️ [API Standards](./api_standards.md) (The Architect)
- Response envelope format
- RESTful URL patterns
- HTTP status codes
- Date/time standards (ISO 8601 UTC)
- API versioning

### 5. 🛡️ [Error Handling](./error_handling.md)
- Graceful failures
- No stack trace exposure
- Standardized error responses
- Logging standards
- Custom exception classes

## When to Summon
These skills are automatically relevant when:
- Creating/modifying database models
- Writing API endpoints
- Handling user authentication
- Processing payments or bookings
- Optimizing slow queries
- Adding new features to the backend

## Quick Reference Commands
```bash
# Check for N+1 queries
grep -r "for.*in.*await" *.py

# Find raw SQL (potential injection)
grep -r "f\"SELECT\|f'SELECT" *.py

# Find unhandled exceptions
grep -r "except:" *.py
```
