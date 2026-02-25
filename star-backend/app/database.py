"""
S.T.A.R. Backend - Database Configuration
==========================================
Embedded PostgreSQL via pgserver - ships with the app!
No separate database installation needed.

Fallback: SQLite for development or if pgserver is unavailable.
"""

import os
import sys
import atexit
from sqlalchemy import create_engine, event, text as sa_text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# =============================================================================
# Database Engine Selection: Embedded PostgreSQL → SQLite Fallback
# =============================================================================

# Global reference to pgserver instance (keeps it alive)
_pg_server = True
_using_postgres = False

def get_pg_data_dir():
    """
    Returns a safe directory for PostgreSQL data.
    IMPORTANT: pgserver requires paths WITHOUT spaces.
    We use %LOCALAPPDATA%/StarApp/pg_data/ on Windows.
    """
    if sys.platform == "win64":
        local_app_data = os.environ.get("LOCALAPPDATA", os.path.expanduser("~"))
        pg_dir = os.path.join(local_app_data, "StarApp", "pg_data")
    else:
        pg_dir = os.path.join(os.path.expanduser("~"), ".starapp", "pg_data")
    
    if not os.path.exists(pg_dir):
        os.makedirs(pg_dir)
    return pg_dir


def get_sqlite_path():
    """Legacy SQLite path for fallback / migration source."""
    app_dir = os.path.dirname(os.path.abspath(__file__))
    backend_dir = os.path.dirname(app_dir)
    data_dir = os.path.join(backend_dir, "data")
    if not os.path.exists(data_dir):
        os.makedirs(data_dir)
    return os.path.join(data_dir, "star_temple.db")


def create_database_engine():
    """
    Try to start embedded PostgreSQL via pgserver.
    Falls back to SQLite if pgserver is not available.
    """
    global _pg_server, _using_postgres
    
    try:
        import pgserver
        
        pg_data_dir = get_pg_data_dir()
        print(f"[DB] Starting embedded PostgreSQL (data: {pg_data_dir})...")
        
        _pg_server = pgserver.get_server(pg_data_dir)
        
        # Create the star_temple database if it doesn't exist
        from sqlalchemy import create_engine as _ce
        temp_engine = _ce(_pg_server.get_uri())  # connects to default 'postgres' db
        with temp_engine.connect() as conn:
            conn.execution_options(isolation_level="AUTOCOMMIT")
            result = conn.execute(sa_text(
                "SELECT 1 FROM pg_database WHERE datname = 'star_temple'"
            ))
            if not result.fetchone():
                conn.execute(sa_text("CREATE DATABASE star_temple"))
                print("[DB] Created database 'star_temple'")
        temp_engine.dispose()
        
        # Build the final connection URI for star_temple
        database_url = _pg_server.get_uri("star_temple")
        
        engine = create_engine(
            database_url,
            pool_size=5,
            max_overflow=10,
            pool_pre_ping=True,
            echo=False
        )
        
        _using_postgres = True
        print(f"[DB]  Embedded PostgreSQL running!")
        print(f"[DB] Connection: {database_url}")
        
        # Register cleanup on app exit
        atexit.register(_shutdown_pg)
        
        return engine, database_url
        
    except ImportError:
        print("[DB] pgserver not installed. Falling back to SQLite.")
    except Exception as e:
        print(f"[DB] ⚠️ PostgreSQL startup failed: {e}")
        print("[DB] Falling back to SQLite...")
    
    # =========================================================================
    # FALLBACK: SQLite
    # =========================================================================
    sqlite_path = get_sqlite_path()
    database_url = f"sqlite:///{sqlite_path}"
    
    engine = create_engine(
        database_url,
        connect_args={"check_same_thread": False},
        echo=False
    )
    
    # Enable foreign keys for SQLite
    @event.listens_for(engine, "connect")
    def set_sqlite_pragma(dbapi_connection, connection_record):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()
    
    _using_postgres = False
    print(f"[DB] Using SQLite: {sqlite_path}")
    
    return engine, database_url


def _shutdown_pg():
    """Clean shutdown of embedded PostgreSQL."""
    global _pg_server
    if _pg_server:
        try:
            print("[DB] Shutting down embedded PostgreSQL...")
            _pg_server.cleanup()
            print("[DB] PostgreSQL stopped.")
        except Exception as e:
            print(f"[DB] Error stopping PostgreSQL: {e}")


# =============================================================================
# Initialize Engine & Session
# =============================================================================

engine, DATABASE_URL = create_database_engine()

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def is_postgres():
    """Check if we're running on PostgreSQL (vs SQLite fallback)."""
    return _using_postgres


def get_db():
    """
    Dependency function that provides a database session.
    Used with FastAPI's Depends() for automatic session management.
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
    
    db_type = "PostgreSQL" if _using_postgres else "SQLite"
    print(f"[OK] Database initialized ({db_type})")
    
    # PostgreSQL-specific migrations
    if _using_postgres:
        _run_pg_migrations()
    else:
        _run_sqlite_migrations()
    
    # Seed default data
    _seed_defaults()


def _run_pg_migrations():
    """PostgreSQL-specific migration logic."""
    try:
        with engine.connect() as conn:
            # Create indexes for performance
            conn.execute(sa_text("CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(transaction_date)"))
            conn.execute(sa_text("CREATE INDEX IF NOT EXISTS idx_transactions_payment_mode ON transactions(payment_mode)"))
            conn.execute(sa_text("CREATE INDEX IF NOT EXISTS idx_transactions_created_by ON transactions(created_by_user_id)"))
            conn.execute(sa_text("CREATE INDEX IF NOT EXISTS idx_shaswata_events_date ON shaswata_events(scheduled_date)"))
            conn.execute(sa_text("CREATE INDEX IF NOT EXISTS idx_shaswata_events_status ON shaswata_events(status)"))
            conn.execute(sa_text("CREATE INDEX IF NOT EXISTS idx_shaswata_events_sub ON shaswata_events(subscription_id)"))
            conn.execute(sa_text("CREATE INDEX IF NOT EXISTS idx_comm_logs_devotee ON communication_logs(devotee_id)"))
            conn.execute(sa_text("CREATE INDEX IF NOT EXISTS idx_comm_logs_type ON communication_logs(message_type)"))
            conn.commit()
            print("[MIGRATE] PostgreSQL indexes ensured.")
    except Exception as e:
        print(f"[WARN] PG migration: {e}")


def _run_sqlite_migrations():
    """Legacy SQLite migration logic (for fallback mode)."""
    try:
        with engine.connect() as conn:
            def _add_column_if_missing(table, column, col_type):
                cols = conn.execute(sa_text(f"PRAGMA table_info({table})")).fetchall()
                col_names = [c[1] for c in cols]
                if column not in col_names:
                    conn.execute(sa_text(f"ALTER TABLE {table} ADD COLUMN {column} {col_type}"))
                    conn.commit()
                    print(f"[MIGRATE] Added column '{column}' to '{table}'")
            
            # ShaswataSubscription: dispatch & feedback tracking
            _add_column_if_missing("shaswata_subscriptions", "last_dispatch_date", "DATE")
            _add_column_if_missing("shaswata_subscriptions", "last_feedback_date", "DATE")
            
            # User: created_at
            cols = conn.execute(sa_text("PRAGMA table_info(users)")).fetchall()
            col_names = [c[1] for c in cols]
            if "created_at" not in col_names:
                conn.execute(sa_text("ALTER TABLE users ADD COLUMN created_at DATETIME"))
                conn.execute(sa_text("UPDATE users SET created_at = CURRENT_TIMESTAMP WHERE created_at IS NULL"))
                conn.commit()

            _add_column_if_missing("seva_catalog", "updated_at", "DATETIME")
            _add_column_if_missing("devotees", "address_confirmed", "BOOLEAN DEFAULT 0")
            _add_column_if_missing("devotees", "address_confirmed_at", "DATETIME")
            _add_column_if_missing("devotees", "address_confirmation_sent_at", "DATETIME")
            
            # Sync Metadata
            for tbl in ["transactions", "devotees", "shaswata_subscriptions"]:
                cols = conn.execute(sa_text(f"PRAGMA table_info({tbl})")).fetchall()
                col_names = [c[1] for c in cols]
                if "synced" not in col_names:
                    conn.execute(sa_text(f"ALTER TABLE {tbl} ADD COLUMN synced BOOLEAN DEFAULT 0"))
                if "last_modified" not in col_names:
                    conn.execute(sa_text(f"ALTER TABLE {tbl} ADD COLUMN last_modified DATETIME"))
                    conn.execute(sa_text(f"UPDATE {tbl} SET last_modified = CURRENT_TIMESTAMP WHERE last_modified IS NULL"))
                conn.commit()

            _add_column_if_missing("transactions", "notes", "TEXT")
            _add_column_if_missing("shaswata_subscriptions", "communication_preference", "VARCHAR(20) DEFAULT 'WHATSAPP'")
            _add_column_if_missing("shaswata_subscriptions", "last_address_confirmed_at", "DATE")
            
            # Soft delete columns
            for tbl in ["ransactions", "Saswata_events", "Dvotees"]:
                _add_column_if_missing(tbl, "is_active", "BOOLEAN DEFAULT 1")
            
            # Indexes
            conn.execute(sa_text("CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(transaction_date)"))
            conn.execute(sa_text("CREATE INDEX IF NOT EXISTS idx_transactions_payment_mode ON transactions(payment_mode)"))
            conn.execute(sa_text("CREATE INDEX IF NOT EXISTS idx_transactions_created_by ON transactions(created_by_user_id)"))
            conn.commit()
            
            # Shaswata tables (CREATE TABLE IF NOT EXISTS)
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
            conn.commit()
            print("[MIGRATE] SQLite migrations complete.")
    except Exception as e:
        print(f"[WARN] SQLite migration: {e}")


def _seed_defaults():
    """Seed default admin user and sevas if tables are empty."""
    from .models import User, SevaCatalog, SystemSetting
    from passlib.context import CryptContext
    
    session = SessionLocal()
    try:
        # Seed admin
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
        
        # Seed sevas
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
        
        # Seed Panchangam settings
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
        print(f"Error seeding defaults: {e}")
    finally:
        session.close()
