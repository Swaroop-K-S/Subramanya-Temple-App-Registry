"""
S.T.A.R. Backend - Database Configuration
==========================================
SQLAlchemy connection to SQLite database.
Fully portable - no database installation required!
"""

import os
import sys
from sqlalchemy import create_engine, event
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# =============================================================================
# SQLite Database - Portable, No Installation Required!
# =============================================================================

import shutil

def get_database_path():
    """
    Determine the persistent database file path.
    - Windows: %APPDATA%/StarApp/star_temple.db
    - Linux/Mac: ~/.local/share/StarApp/star_temple.db
    """
    app_name = "StarApp"
    
    # 1. Determine User Data Directory
    if sys.platform == "win32":
        user_data_dir = os.getenv('APPDATA')
    else:
        user_data_dir = os.path.expanduser("~/.local/share")
        
    app_data_dir = os.path.join(user_data_dir, app_name)
    
    # Ensure directory exists
    if not os.path.exists(app_data_dir):
        os.makedirs(app_data_dir)
        
    target_db_path = os.path.join(app_data_dir, 'star_temple.db')
    
    # 2. Migration Check (Import Legacy Data)
    # If DB exists in legacy location (next to exe or source), copy it over
    # This ensures users don't lose data when upgrading to this version.
    
    legacy_path = None
    if getattr(sys, 'frozen', False):
        # Bundled exe legacy path
        legacy_path = os.path.join(os.path.dirname(sys.executable), 'star_temple.db')
    else:
        # Dev mode legacy path (was inside app/)
        legacy_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'star_temple.db')
        
    # Condition: Target missing AND Legacy exists -> MIGRATE
    if not os.path.exists(target_db_path) and os.path.exists(legacy_path):
        print(f"[MIGRATE] Found legacy database at: {legacy_path}")
        print(f"[MIGRATE] Moving to persistent storage: {target_db_path}...")
        try:
            shutil.copy2(legacy_path, target_db_path)
            print("[MIGRATE] Success! Data preserved.")
        except Exception as e:
             print(f"[MIGRATE] Failed to copy database: {e}")
             
    return target_db_path

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
    
    # Create tables (new installs) — does NOT alter existing tables
    ModelsBase.metadata.create_all(bind=engine)
    print(f"[OK] Database initialized at: {DATABASE_PATH}")
    
    # Migrate existing databases: add missing columns safely
    from sqlalchemy import text as sa_text
    try:
        with engine.connect() as conn:
            def _add_column_if_missing(table, column, col_type):
                """Safely add a column to an existing table if it doesn't exist."""
                # PRAGMA returns list of (cid, name, type, notnull, dflt_value, pk)
                cols = conn.execute(sa_text(f"PRAGMA table_info({table})")).fetchall()
                col_names = [c[1] for c in cols]
                if column not in col_names:
                    conn.execute(sa_text(f"ALTER TABLE {table} ADD COLUMN {column} {col_type}"))
                    conn.commit()
                    print(f"[MIGRATE] Added column '{column}' to '{table}'")
            
            # ShaswataSubscription: dispatch & feedback tracking
            _add_column_if_missing("shaswata_subscriptions", "last_dispatch_date", "DATE")
            _add_column_if_missing("shaswata_subscriptions", "last_feedback_date", "DATE")
            # User: created_at timestamp
            # SQLite workaround: Add as nullable first, then backfill
            cols = conn.execute(sa_text(f"PRAGMA table_info(users)")).fetchall()
            col_names = [c[1] for c in cols]
            if "created_at" not in col_names:
                conn.execute(sa_text("ALTER TABLE users ADD COLUMN created_at DATETIME"))
                conn.execute(sa_text("UPDATE users SET created_at = CURRENT_TIMESTAMP WHERE created_at IS NULL"))
                conn.commit()
                print(f"[MIGRATE] Added column 'created_at' to 'users'")
            
            # Sync Metadata Migration (Phase 3)
            for tbl in ["transactions", "devotees", "shaswata_subscriptions"]:
                cols = conn.execute(sa_text(f"PRAGMA table_info({tbl})")).fetchall()
                col_names = [c[1] for c in cols]
                
                if "synced" not in col_names:
                    conn.execute(sa_text(f"ALTER TABLE {tbl} ADD COLUMN synced BOOLEAN DEFAULT 0"))
                    print(f"[MIGRATE] Added 'synced' to '{tbl}'")
                    
                if "last_modified" not in col_names:
                    conn.execute(sa_text(f"ALTER TABLE {tbl} ADD COLUMN last_modified DATETIME"))
                    conn.execute(sa_text(f"UPDATE {tbl} SET last_modified = CURRENT_TIMESTAMP WHERE last_modified IS NULL"))
                    print(f"[MIGRATE] Added 'last_modified' to '{tbl}'")
                
                conn.commit()
            
    except Exception as e:
        print(f"[WARN] Migration check: {e}")
    
    # Seed default admin if no users exist
    session = SessionLocal()
    try:
        count = session.query(User).count()
        if count == 0:
            print("[INFO] No users found. Creating default admin...")
            pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")
            admin = User(
                username="admin",
                hashed_password=pwd_context.hash("admin123"),
                role="admin",
                is_active=True
            )
            session.add(admin)
            session.commit()
            print("[OK] Created default user: admin / admin123")
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
