"""
S.T.A.R. Backend - Database Configuration
==========================================
SQLAlchemy connection to SQLite database.
Fully portable - no database installation required!
"""

import os
import sys
import secrets
from sqlalchemy import create_engine, event
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# =============================================================================
# SQLite Database - Portable, No Installation Required!
# =============================================================================

def get_database_path():
    """
    Determine the database file path based on execution context.
    - Bundled exe: Database stored next to the .exe file
    - Dev mode: Database stored in star-backend folder
    """
    if getattr(sys, 'frozen', False):
        # Running as bundled .exe - store DB next to the executable
        exe_dir = os.path.dirname(sys.executable)
        return os.path.join(exe_dir, 'star_temple.db')
    else:
        # Dev mode - store in backend directory
        return os.path.join(os.path.dirname(os.path.abspath(__file__)), 'star_temple.db')

DATABASE_PATH = get_database_path()
DATABASE_URL = f"sqlite:///{DATABASE_PATH}"

# Create the SQLAlchemy engine with SQLite-specific settings
engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False},  # Required for SQLite with FastAPI
    echo=False  # Set to True for SQL debugging
)

# Enable foreign keys for SQLite (disabled by default)
@event.listens_for(engine, "connect")
def set_sqlite_pragma(dbapi_connection, connection_record):
    cursor = dbapi_connection.cursor()
    cursor.execute("PRAGMA foreign_keys=ON")
    cursor.close()

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


def init_database():
    """
    Initialize the database by creating all tables.
    Called on app startup.
    Also seeds default admin if no users exist.
    """
    from .models import Base as ModelsBase, User
    from passlib.context import CryptContext
    
    # Create tables
    ModelsBase.metadata.create_all(bind=engine)
    print(f"[OK] Database initialized at: {DATABASE_PATH}")
    
    # Seed bootstrap admin if no users exist
    session = SessionLocal()
    try:
        count = session.query(User).count()
        if count == 0:
            print("[INFO] No users found. Creating bootstrap admin...")
            pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")
            admin_username = os.getenv("ADMIN_BOOTSTRAP_USERNAME", "admin")
            admin_password = os.getenv("ADMIN_BOOTSTRAP_PASSWORD") or secrets.token_urlsafe(12)
            if not os.getenv("ADMIN_BOOTSTRAP_PASSWORD"):
                print(f"[WARN] ADMIN_BOOTSTRAP_PASSWORD not set. Generated one-time bootstrap password: {admin_password}")

            admin = User(
                username=admin_username,
                hashed_password=pwd_context.hash(admin_password),
                role="admin",
                is_active=True
            )
            session.add(admin)
            session.commit()
            print(f"[OK] Created bootstrap admin user: {admin_username}")
    except Exception as e:
        print(f"Error seeding admin: {e}")

    # Seed default Sevas if catalog is empty
    try:
        from .models import SevaCatalog
        count_sevas = session.query(SevaCatalog).count()
        if count_sevas == 0:
            print("[INFO] No sevas found. Seeding default catalog...")
            default_sevas = [
                SevaCatalog(name_eng="Kunkuma Archane", name_kan="ಕುಂಕುಮ ಅರ್ಚನೆ", price=20.0),
                SevaCatalog(name_eng="Panchambruta Abhisheka", name_kan="ಪಂಚಾಮೃತ ಅಭಿಷೇಕ", price=100.0),
                SevaCatalog(name_eng="Ksheera Abhisheka", name_kan="ಕ್ಷೀರಾಭಿಷೇಕ", price=150.0),
                SevaCatalog(name_eng="Rudra Abhisheka", name_kan="ರುದ್ರ ಅಭಿಷೇಕ", price=250.0),
                SevaCatalog(name_eng="Anna Dhana Nidhi", name_kan="ಅನ್ನ ದಾನ ನಿಧಿ", price=0.0),
                SevaCatalog(name_eng="General", name_kan="ಸಾಮಾನ್ಯ", price=0.0),
                SevaCatalog(name_eng="Rajata Ashtottara Seva", name_kan="ರಜತ ಅಷ್ಟೋತ್ತರ ಸೇವೆ", price=500.0),
            ]
            session.add_all(default_sevas)
            session.commit()
            print(f"[OK] Seeded {len(default_sevas)} sevas.")
    except Exception as e:
        print(f"Error seeding sevas: {e}")

    finally:
        session.close()
