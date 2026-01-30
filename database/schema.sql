-- =============================================================================
-- S.T.A.R. (Subramanya Temple App & Registry) - PostgreSQL Database Schema
-- =============================================================================
-- Author: Database Architect
-- Created: 2026-01-30
-- Description: Complete database schema for temple seva management system
-- =============================================================================

-- -----------------------------------------------------------------------------
-- SECTION 1: ENUM TYPES
-- Define all custom ENUM types before creating tables that use them.
-- -----------------------------------------------------------------------------

-- User roles for staff authentication
CREATE TYPE user_role AS ENUM ('admin', 'counter_staff');

-- Payment modes accepted at the temple counter
CREATE TYPE payment_mode AS ENUM ('CASH', 'UPI');

-- Hindu lunar months (Masa)
-- The 12 months of the Hindu Panchanga calendar
CREATE TYPE masa_type AS ENUM (
    'Chaitra',      -- March-April
    'Vaishakha',    -- April-May
    'Jyeshtha',     -- May-June
    'Ashadha',      -- June-July
    'Shravana',     -- July-August
    'Bhadrapada',   -- August-September
    'Ashwina',      -- September-October
    'Kartika',      -- October-November
    'Margashirsha', -- November-December
    'Pausha',       -- December-January
    'Magha',        -- January-February
    'Phalguna'      -- February-March
);

-- Paksha (Lunar fortnight) - Shukla (Waxing) and Krishna (Waning)
CREATE TYPE paksha_type AS ENUM ('Shukla', 'Krishna');


-- -----------------------------------------------------------------------------
-- SECTION 2: TABLE - users
-- For Temple Staff and Trustees authentication
-- -----------------------------------------------------------------------------

CREATE TABLE users (
    id              SERIAL PRIMARY KEY,
    username        VARCHAR(50) NOT NULL UNIQUE,
    password_hash   VARCHAR(255) NOT NULL,  -- Store hashed passwords only (bcrypt/argon2)
    role            user_role NOT NULL DEFAULT 'counter_staff',
    phone_number    VARCHAR(15),
    
    -- Audit columns
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active       BOOLEAN DEFAULT TRUE
);

COMMENT ON TABLE users IS 'Temple staff and trustee accounts for system access';
COMMENT ON COLUMN users.password_hash IS 'Store only hashed passwords using bcrypt or argon2';
COMMENT ON COLUMN users.role IS 'admin: Full access, counter_staff: POS operations only';


-- -----------------------------------------------------------------------------
-- SECTION 3: TABLE - seva_catalog
-- The Master List defining 14 types of receipts/sevas offered at the temple
-- -----------------------------------------------------------------------------

CREATE TABLE seva_catalog (
    id              SERIAL PRIMARY KEY,
    name_eng        VARCHAR(100) NOT NULL UNIQUE,  -- English name
    name_kan        VARCHAR(100),                   -- Kannada name (ಕನ್ನಡ)
    price           DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    is_shaswata     BOOLEAN DEFAULT FALSE,  -- TRUE for recurring annual Pooja
    is_slot_based   BOOLEAN DEFAULT FALSE,  -- TRUE for sevas requiring slot booking (e.g., Alankara)
    daily_limit     INTEGER,                -- NULL = unlimited, otherwise max per day
    
    -- Audit columns
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active       BOOLEAN DEFAULT TRUE
);

COMMENT ON TABLE seva_catalog IS 'Master catalog of all 14 seva/receipt types offered at the temple';
COMMENT ON COLUMN seva_catalog.is_shaswata IS 'TRUE for Shashwata (perpetual/recurring) sevas performed annually';
COMMENT ON COLUMN seva_catalog.is_slot_based IS 'TRUE for sevas that require advance slot booking (Alankara, Homa)';
COMMENT ON COLUMN seva_catalog.daily_limit IS 'Maximum bookings per day, NULL means unlimited';
COMMENT ON COLUMN seva_catalog.price IS 'Base price in INR. Some sevas like Tulabhara have variable pricing';


-- -----------------------------------------------------------------------------
-- SECTION 4: TABLE - devotees
-- Reusable devotee profiles to speed up booking process
-- -----------------------------------------------------------------------------

CREATE TABLE devotees (
    id              SERIAL PRIMARY KEY,
    full_name       VARCHAR(150) NOT NULL,
    phone_number    VARCHAR(15) UNIQUE,     -- Unique for lookup/search
    gothra          VARCHAR(50),            -- Gotra (ancestral lineage)
    nakshatra       VARCHAR(30),            -- Birth star
    rashi           VARCHAR(30),            -- Zodiac sign (Mesha to Meena)
    address         TEXT,
    
    -- Audit columns
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE devotees IS 'Reusable devotee profiles for quick booking - searchable by phone number';
COMMENT ON COLUMN devotees.gothra IS 'Ancestral lineage (e.g., Kashyapa, Bharadwaja, Vasishtha)';
COMMENT ON COLUMN devotees.nakshatra IS 'Birth star for panchanga-based rituals (e.g., Ashwini, Bharani)';
COMMENT ON COLUMN devotees.rashi IS 'Moon sign / Zodiac (e.g., Mesha, Vrishabha, Mithuna)';

-- Index for fast phone number lookup
CREATE INDEX idx_devotees_phone ON devotees(phone_number);
CREATE INDEX idx_devotees_name ON devotees(full_name);


-- -----------------------------------------------------------------------------
-- SECTION 5: TABLE - shaswata_subscriptions
-- The core of the recurring (Shashwata) puja system
-- Links a devotee to a recurring seva with lunar or Gregorian date triggers
-- -----------------------------------------------------------------------------

CREATE TABLE shaswata_subscriptions (
    id                  SERIAL PRIMARY KEY,
    devotee_id          INTEGER NOT NULL REFERENCES devotees(id) ON DELETE CASCADE,
    seva_id             INTEGER NOT NULL REFERENCES seva_catalog(id) ON DELETE RESTRICT,
    
    -- =========================================================================
    -- LUNAR DATE COLUMNS (Hindu Panchanga Calendar)
    -- Used for traditional tithi-based recurring sevas
    -- =========================================================================
    masa_id             masa_type,              -- Hindu month (Chaitra to Phalguna)
    paksha              paksha_type,            -- Shukla (waxing) or Krishna (waning)
    tithi               INTEGER CHECK (tithi >= 1 AND tithi <= 15),  -- Day of lunar fortnight (1-15)
    nakshatra_trigger   VARCHAR(30),            -- Optional: Perform on specific nakshatra
    
    -- =========================================================================
    -- GREGORIAN DATE COLUMN
    -- For fixed-date events like birthdays, anniversaries
    -- =========================================================================
    fixed_event_date    DATE,                   -- E.g., birthday (NULL if lunar-based)
    
    -- =========================================================================
    -- TRACKING
    -- =========================================================================
    last_performed_year INTEGER,                -- Year when seva was last performed
    
    -- Audit columns
    created_at          TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active           BOOLEAN DEFAULT TRUE,
    notes               TEXT                    -- Additional notes about the subscription
);

COMMENT ON TABLE shaswata_subscriptions IS 'Recurring (Shashwata) puja subscriptions - performed annually on lunar or fixed dates';
COMMENT ON COLUMN shaswata_subscriptions.masa_id IS 'Hindu lunar month for the seva (NULL if using fixed Gregorian date)';
COMMENT ON COLUMN shaswata_subscriptions.paksha IS 'Shukla (bright/waxing) or Krishna (dark/waning) fortnight';
COMMENT ON COLUMN shaswata_subscriptions.tithi IS 'Day of the lunar fortnight (1=Pratipada, 15=Purnima/Amavasya)';
COMMENT ON COLUMN shaswata_subscriptions.nakshatra_trigger IS 'Optional: Specific nakshatra on which seva should be performed';
COMMENT ON COLUMN shaswata_subscriptions.fixed_event_date IS 'For Gregorian-based events (birthdays). Only month-day is relevant each year';
COMMENT ON COLUMN shaswata_subscriptions.last_performed_year IS 'Tracks the last year this recurring seva was performed';

-- Indexes for efficient queries
CREATE INDEX idx_shaswata_devotee ON shaswata_subscriptions(devotee_id);
CREATE INDEX idx_shaswata_seva ON shaswata_subscriptions(seva_id);
CREATE INDEX idx_shaswata_lunar ON shaswata_subscriptions(masa_id, paksha, tithi);


-- -----------------------------------------------------------------------------
-- SECTION 6: TABLE - transactions
-- The financial ledger - records all receipts and payments
-- -----------------------------------------------------------------------------

CREATE TABLE transactions (
    id                  SERIAL PRIMARY KEY,
    receipt_no          VARCHAR(50) NOT NULL UNIQUE,  -- Temple receipt number (e.g., "STR-2026-00001")
    devotee_id          INTEGER REFERENCES devotees(id) ON DELETE SET NULL,  -- Nullable for walk-ins
    seva_id             INTEGER NOT NULL REFERENCES seva_catalog(id) ON DELETE RESTRICT,
    amount_paid         DECIMAL(10, 2) NOT NULL CHECK (amount_paid >= 0),
    payment_mode        payment_mode NOT NULL DEFAULT 'CASH',
    transaction_date    TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by_user_id  INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    
    -- Additional useful columns
    devotee_name        VARCHAR(150),           -- Store name at transaction time (for walk-ins or name changes)
    notes               TEXT,                   -- Special instructions or details
    
    -- Audit columns
    created_at          TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE transactions IS 'Financial ledger recording all seva receipts and payments';
COMMENT ON COLUMN transactions.receipt_no IS 'Unique receipt number printed on ticket (format: STR-YYYY-NNNNN)';
COMMENT ON COLUMN transactions.devotee_id IS 'NULL for walk-in devotees who do not wish to register';
COMMENT ON COLUMN transactions.devotee_name IS 'Captures devotee name at transaction time for historical accuracy';
COMMENT ON COLUMN transactions.created_by_user_id IS 'Staff member who processed this transaction';

-- Indexes for reporting and lookups
CREATE INDEX idx_transactions_date ON transactions(transaction_date);
CREATE INDEX idx_transactions_receipt ON transactions(receipt_no);
CREATE INDEX idx_transactions_devotee ON transactions(devotee_id);
CREATE INDEX idx_transactions_seva ON transactions(seva_id);
CREATE INDEX idx_transactions_created_by ON transactions(created_by_user_id);


-- -----------------------------------------------------------------------------
-- SECTION 7: TABLE - daily_slots
-- Slot management to prevent double-booking for limited sevas (e.g., Benne Alankara)
-- -----------------------------------------------------------------------------

CREATE TABLE daily_slots (
    id              SERIAL PRIMARY KEY,
    slot_date       DATE NOT NULL,
    seva_id         INTEGER NOT NULL REFERENCES seva_catalog(id) ON DELETE CASCADE,
    is_booked       BOOLEAN DEFAULT FALSE,
    
    -- Booking reference (when booked)
    transaction_id  INTEGER REFERENCES transactions(id) ON DELETE SET NULL,
    devotee_id      INTEGER REFERENCES devotees(id) ON DELETE SET NULL,
    
    -- Audit columns
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Ensure one slot per seva per day
    CONSTRAINT unique_daily_slot UNIQUE (slot_date, seva_id)
);

COMMENT ON TABLE daily_slots IS 'Manages daily slot availability for limited sevas like Benne Alankara';
COMMENT ON COLUMN daily_slots.is_booked IS 'TRUE if slot is reserved, FALSE if available';
COMMENT ON COLUMN daily_slots.transaction_id IS 'Reference to the transaction that booked this slot';

-- Index for efficient date-based queries
CREATE INDEX idx_daily_slots_date ON daily_slots(slot_date);
CREATE INDEX idx_daily_slots_seva_date ON daily_slots(seva_id, slot_date);


-- =============================================================================
-- SECTION 8: SEED DATA - seva_catalog
-- Populating the 14 seva types as specified
-- =============================================================================

INSERT INTO seva_catalog (name_eng, name_kan, price, is_shaswata, is_slot_based, daily_limit) VALUES
-- Regular Sevas (Non-Shaswata, Non-Slot)
('Kunkuma Archane', 'ಕುಂಕುಮ ಅರ್ಚನೆ', 20.00, FALSE, FALSE, NULL),
('Panchambruta Abhisheka', 'ಪಂಚಾಮೃತ ಅಭಿಷೇಕ', 100.00, FALSE, FALSE, NULL),
('Rudra Abhisheka', 'ರುದ್ರ ಅಭಿಷೇಕ', 250.00, FALSE, FALSE, NULL),
('Ksheera Abhisheka', 'ಕ್ಷೀರ ಅಭಿಷೇಕ', 150.00, FALSE, FALSE, NULL),
('Rajata Ashtottara Seva', 'ರಜತ ಅಷ್ಟೋತ್ತರ ಸೇವೆ', 500.00, FALSE, FALSE, NULL),
('Pavamana Abhisheka', 'ಪವಮಾನ ಅಭಿಷೇಕ', 300.00, FALSE, FALSE, NULL),

-- Shaswata (Recurring) Sevas
('Shashwata Pooja', 'ಶಾಶ್ವತ ಪೂಜೆ', 5000.00, TRUE, FALSE, NULL),
('Shashwata Brahmachari Pooja', 'ಶಾಶ್ವತ ಬ್ರಹ್ಮಚಾರಿ ಪೂಜೆ', 3000.00, TRUE, FALSE, NULL),

-- Donation Category
('Anna Dhana Nidhi', 'ಅನ್ನ ದಾನ ನಿಧಿ', 0.00, FALSE, FALSE, NULL),

-- Variable Price Seva
('Tulabhara', 'ತುಲಾಭಾರ', 0.00, FALSE, FALSE, NULL),

-- Slot-Based Sevas (Require Advance Booking)
('Subramanya Homa', 'ಸುಬ್ರಹ್ಮಣ್ಯ ಹೋಮ', 1500.00, FALSE, TRUE, 2),
('Benne Alankara', 'ಬೆಣ್ಣೆ ಅಲಂಕಾರ', 2500.00, FALSE, TRUE, 1),

-- General Category
('General', 'ಸಾಮಾನ್ಯ', 0.00, FALSE, FALSE, NULL),

-- Special Seva
('Thotlu Seve', 'ತೊಟ್ಟಲು ಸೇವೆ', 500.00, FALSE, FALSE, NULL);


-- =============================================================================
-- SECTION 9: HELPFUL VIEWS (Optional but recommended)
-- =============================================================================

-- View: Today's pending Shaswata subscriptions
CREATE VIEW vw_todays_shaswata AS
SELECT 
    ss.id AS subscription_id,
    d.full_name,
    d.phone_number,
    d.gothra,
    sc.name_eng AS seva_name,
    ss.masa_id,
    ss.paksha,
    ss.tithi,
    ss.last_performed_year
FROM shaswata_subscriptions ss
JOIN devotees d ON ss.devotee_id = d.id
JOIN seva_catalog sc ON ss.seva_id = sc.id
WHERE ss.is_active = TRUE;

COMMENT ON VIEW vw_todays_shaswata IS 'View to list active Shaswata subscriptions - filter by current panchanga date in application';


-- View: Daily collection summary
CREATE VIEW vw_daily_collections AS
SELECT 
    DATE(transaction_date) AS txn_date,
    sc.name_eng AS seva_name,
    payment_mode,
    COUNT(*) AS transaction_count,
    SUM(amount_paid) AS total_amount
FROM transactions t
JOIN seva_catalog sc ON t.seva_id = sc.id
GROUP BY DATE(transaction_date), sc.name_eng, payment_mode
ORDER BY txn_date DESC, seva_name;

COMMENT ON VIEW vw_daily_collections IS 'Daily collection summary grouped by seva type and payment mode';


-- =============================================================================
-- SECTION 10: INITIAL ADMIN USER (Change password immediately!)
-- =============================================================================

-- WARNING: This is a placeholder hash. In production, generate a proper bcrypt hash!
-- Example using pgcrypto: crypt('admin123', gen_salt('bf'))
INSERT INTO users (username, password_hash, role, phone_number) VALUES
('admin', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.HYfcTjXQZXwZ.m', 'admin', '9999999999');

COMMENT ON TABLE users IS 'SECURITY: Change the default admin password immediately after deployment!';


-- =============================================================================
-- END OF SCHEMA
-- =============================================================================
