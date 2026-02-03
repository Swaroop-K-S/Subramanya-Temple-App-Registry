# Level 7: The Live Database Surgeon

**Status**: CONFIGURED (Pending Credentials)
**Access Level**: Read-Only (Default) / Read-Write (Authorized)
**Protocol**: Secure Tunnel (SSH/SSL)

## Capabilities
- **Anomaly Detection**: analyzes transaction logs for statistical outliers.
- **Performance Querying**: `EXPLAIN ANALYZE` on slow queries.
- **Migration Assistant**: Auto-generates Alembic/SQL scripts based on schema changes.

## Safeguards
- **Drop Protection**: `DROP TABLE` commands require double-confirmation.
- **PII Masking**: Auto-redacts phone numbers and names in query outputs.
