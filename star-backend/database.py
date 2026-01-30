"""
S.T.A.R. Backend - Database Configuration
==========================================
SQLAlchemy connection to PostgreSQL database.
"""

from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# =============================================================================
# ⚠️  IMPORTANT: Replace 'YOUR_PASSWORD' with your actual PostgreSQL password!
# =============================================================================
# Example: postgresql://postgres:mySecurePassword123@localhost/star_temple_db
# 
# For production, use environment variables:
#   import os
#   DATABASE_URL = os.getenv("DATABASE_URL")
# =============================================================================

DATABASE_URL = "postgresql://postgres:swaroop@localhost/star_temple_db"

# Create the SQLAlchemy engine
engine = create_engine(DATABASE_URL)

# SessionLocal class - each instance will be a database session
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for our ORM models
Base = declarative_base()


def get_db():
    """
    Dependency function that provides a database session.
    Used with FastAPI's Depends() for automatic session management.
    
    Usage in routes:
        @app.get("/items")
        def get_items(db: Session = Depends(get_db)):
            ...
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
