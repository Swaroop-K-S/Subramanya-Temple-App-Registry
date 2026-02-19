"""
S.T.A.R. Backend - Database Configuration
==========================================
SQLAlchemy connection to SQLite database.
Fully portable - database stored inside the app directory!
"""

import os
import sys
from sqlalchemy import create_engine, event
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# =============================================================================
# SQLite Database - Stored Inside App Directory (Portable)
# =============================================================================

def get_database_path():
    """
    Database file lives inside the app's own directory.
    star-backend/data/star_temple.db
    """
    # Get the directory where this file (database.py) lives → app/
    app_dir = os.path.dirname(os.path.abspath(__file__))
    # Go up one level to star-backend/
    backend_dir = os.path.dirname(app_dir)
    # Store in star-backend/data/
    data_dir = os.path.join(backend_dir, "data")
    
    print(f"DEBUG DB: __file__ = {os.path.abspath(__file__)}")
    print(f"DEBUG DB: app_dir = {app_dir}")
    print(f"DEBUG DB: backend_dir = {backend_dir}")
    print(f"DEBUG DB: data_dir = {data_dir}")
    
    # Ensure data directory exists
    if not os.path.exists(data_dir):
        os.makedirs(data_dir)
        
    return os.path.join(data_dir, "star_temple.db")


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
            cols = conn.execute(sa_text(f"PRAGMA table_info(users)")).fetchall()
            col_names = [c[1] for c in cols]
            if "created_at" not in col_names:
                conn.execute(sa_text("ALTER TABLE users ADD COLUMN created_at DATETIME"))
                conn.execute(sa_text("UPDATE users SET created_at = CURRENT_TIMESTAMP WHERE created_at IS NULL"))
                conn.commit()
                print(f"[MIGRATE] Added column 'created_at' to 'users'")

            # SevaCatalog: updated_at timestamp
            _add_column_if_missing("seva_catalog", "updated_at", "DATETIME")
            
            # Devotee: Address Confirmation Tracking
            _add_column_if_missing("devotees", "address_confirmed", "BOOLEAN DEFAULT 0")
            _add_column_if_missing("devotees", "address_confirmed_at", "DATETIME")
            _add_column_if_missing("devotees", "address_confirmation_sent_at", "DATETIME")
            
            # Sync Metadata Migration
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
                
                if "last_modified" not in col_names:
                    conn.execute(sa_text(f"ALTER TABLE {tbl} ADD COLUMN last_modified DATETIME"))
                    conn.execute(sa_text(f"UPDATE {tbl} SET last_modified = CURRENT_TIMESTAMP WHERE last_modified IS NULL"))
                    print(f"[MIGRATE] Added 'last_modified' to '{tbl}'")
                
                conn.commit()

            # Ensure 'notes' column exists in transactions
            _add_column_if_missing("transactions", "notes", "TEXT")
            
            
            # Performance: Index on transaction_date for fast daily lookups
            conn.execute(sa_text("CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(transaction_date)"))
            conn.execute(sa_text("CREATE INDEX IF NOT EXISTS idx_transactions_payment_mode ON transactions(payment_mode)"))
            conn.execute(sa_text("CREATE INDEX IF NOT EXISTS idx_transactions_created_by ON transactions(created_by_user_id)"))
            conn.commit()
            print("[MIGRATE] Ensured performance indexes and Phase 2 columns on transactions")
            
            # ==================================================================
            # SHASWATA PHASE 1: New tables & columns for lifecycle tracking
            # ==================================================================
            
            # 1. Add new columns to shaswata_subscriptions
            _add_column_if_missing("shaswata_subscriptions", "communication_preference", "VARCHAR(20) DEFAULT 'WHATSAPP'")
            _add_column_if_missing("shaswata_subscriptions", "last_address_confirmed_at", "DATE")
            
            # 2. Create shaswata_events table (annual lifecycle tracking)
            conn.execute(sa_text("""
                CREATE TABLE IF NOT EXISTS shaswata_events (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    subscription_id INTEGER NOT NULL REFERENCES shaswata_subscriptions(id) ON DELETE CASCADE,
                    scheduled_date DATE NOT NULL,
                    year INTEGER NOT NULL,
                    status VARCHAR(20) DEFAULT 'PENDING',
                    pooja_completed_at DATETIME,
                    dispatch_date DATE,
                    dispatch_ref VARCHAR(100),
                    dispatch_method VARCHAR(30),
                    delivery_status VARCHAR(20),
                    delivery_checked_at DATE,
                    delivery_notes TEXT,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME
                )
            """))
            conn.execute(sa_text("CREATE INDEX IF NOT EXISTS idx_shaswata_events_date ON shaswata_events(scheduled_date)"))
            conn.execute(sa_text("CREATE INDEX IF NOT EXISTS idx_shaswata_events_status ON shaswata_events(status)"))
            conn.execute(sa_text("CREATE INDEX IF NOT EXISTS idx_shaswata_events_sub ON shaswata_events(subscription_id)"))
            
            # 3. Create communication_logs table (message audit trail)
            conn.execute(sa_text("""
                CREATE TABLE IF NOT EXISTS communication_logs (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    devotee_id INTEGER NOT NULL REFERENCES devotees(id) ON DELETE CASCADE,
                    subscription_id INTEGER REFERENCES shaswata_subscriptions(id) ON DELETE SET NULL,
                    event_id INTEGER REFERENCES shaswata_events(id) ON DELETE SET NULL,
                    message_type VARCHAR(30) NOT NULL,
                    channel VARCHAR(20) NOT NULL,
                    recipient_phone VARCHAR(15),
                    status VARCHAR(20) DEFAULT 'SENT',
                    error_message TEXT,
                    message_preview TEXT,
                    sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    sent_by_user_id INTEGER
                )
            """))
            conn.execute(sa_text("CREATE INDEX IF NOT EXISTS idx_comm_logs_devotee ON communication_logs(devotee_id)"))
            conn.execute(sa_text("CREATE INDEX IF NOT EXISTS idx_comm_logs_type ON communication_logs(message_type)"))
            
            conn.commit()
            print("[MIGRATE] Phase 1 Shaswata tables & indexes created successfully")
            
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
                SevaCatalog(name_eng="Shaswata Brahmachari Pooja", name_kan="ಶಾಶ್ವತ ಬ್ರಹ್ಮಚಾರಿ ಪೂಜೆ", price=0.0),
            ]
            session.add_all(default_sevas)
            session.commit()
            print(f"[OK] Seeded {len(default_sevas)} sevas.")
    except Exception as e:
        print(f"Error seeding sevas: {e}")

    # Seed default Panchangam system settings if missing
    try:
        from .models import SystemSetting
        panchang_defaults = [
            SystemSetting(key="temple_lat", value="12.6745", value_type="STRING",
                          description="Temple Latitude (default: Kukke Subramanya)", category="panchang"),
            SystemSetting(key="temple_lon", value="75.3370", value_type="STRING",
                          description="Temple Longitude (default: Kukke Subramanya)", category="panchang"),
            SystemSetting(key="temple_elevation", value="120", value_type="INTEGER",
                          description="Temple Elevation in meters", category="panchang"),
            SystemSetting(key="panchang_ayanamsa", value="lahiri", value_type="STRING",
                          description="Ayanamsa system (lahiri / raman / kp)", category="panchang"),
            SystemSetting(key="panchang_cache_version", value="1", value_type="INTEGER",
                          description="Bump to invalidate cached panchang data", category="panchang"),
        ]
        for setting in panchang_defaults:
            existing = session.query(SystemSetting).filter_by(key=setting.key).first()
            if not existing:
                session.add(setting)
        session.commit()
        print("[OK] Ensured Panchangam system settings exist.")
    except Exception as e:
        print(f"Error seeding panchang settings: {e}")

    finally:
        session.close()
