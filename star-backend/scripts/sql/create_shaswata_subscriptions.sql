-- =============================================================================
-- SHASWATA SUBSCRIPTIONS TABLE
-- =============================================================================
-- Purpose: Store perpetual/annual puja subscriptions with three date types:
--   1. GREGORIAN: Fixed English calendar date (e.g., Birthday on 15th March)
--   2. LUNAR: Hindu Tithi date (e.g., Chaitra Shukla Purnima)
--   3. RATHOTSAVA: Fixed annual temple festival (no date needed)
-- =============================================================================

CREATE TABLE IF NOT EXISTS shaswata_subscriptions (
    -- Primary Key
    id SERIAL PRIMARY KEY,
    
    -- Foreign Keys
    devotee_id INTEGER NOT NULL REFERENCES devotees(id) ON DELETE CASCADE,
    seva_id INTEGER REFERENCES seva_catalog(id) ON DELETE SET NULL,
    
    -- Subscription Type: 'GREGORIAN', 'LUNAR', or 'RATHOTSAVA'
    subscription_type VARCHAR(20) NOT NULL CHECK (subscription_type IN ('GREGORIAN', 'LUNAR', 'RATHOTSAVA')),
    
    -- Seva Type: 'GENERAL' or 'BRAHMACHARI'
    seva_type VARCHAR(20) DEFAULT 'GENERAL',
    
    -- Gregorian Date Fields (for GREGORIAN type)
    event_day INTEGER CHECK (event_day >= 1 AND event_day <= 31),
    event_month INTEGER CHECK (event_month >= 1 AND event_month <= 12),
    
    -- Lunar Date Fields (for LUNAR type)
    maasa VARCHAR(50),      -- Hindu month: Chaitra, Vaishakha, etc.
    paksha VARCHAR(20),     -- Fortnight: Shukla (bright) or Krishna (dark)
    tithi VARCHAR(50),      -- Lunar day: Pratipada, Dwitiya, ..., Purnima, Amavasya
    
    -- Status & Metadata
    is_active BOOLEAN DEFAULT TRUE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- INDEXES FOR PERFORMANCE
-- =============================================================================

-- Index for finding active subscriptions by devotee
CREATE INDEX IF NOT EXISTS idx_shaswata_devotee ON shaswata_subscriptions(devotee_id);

-- Index for finding subscriptions by type
CREATE INDEX IF NOT EXISTS idx_shaswata_type ON shaswata_subscriptions(subscription_type);

-- Index for finding Gregorian subscriptions by date
CREATE INDEX IF NOT EXISTS idx_shaswata_gregorian ON shaswata_subscriptions(event_month, event_day) 
    WHERE subscription_type = 'GREGORIAN';

-- Index for finding Lunar subscriptions
CREATE INDEX IF NOT EXISTS idx_shaswata_lunar ON shaswata_subscriptions(maasa, paksha, tithi) 
    WHERE subscription_type = 'LUNAR';

-- Index for finding active subscriptions
CREATE INDEX IF NOT EXISTS idx_shaswata_active ON shaswata_subscriptions(is_active) 
    WHERE is_active = TRUE;

-- =============================================================================
-- SAMPLE DATA (Optional - for testing)
-- =============================================================================
-- INSERT INTO shaswata_subscriptions (devotee_id, seva_id, subscription_type, seva_type, event_day, event_month) 
-- VALUES (1, 1, 'GREGORIAN', 'GENERAL', 15, 3);

-- INSERT INTO shaswata_subscriptions (devotee_id, seva_id, subscription_type, seva_type, maasa, paksha, tithi) 
-- VALUES (1, 1, 'LUNAR', 'GENERAL', 'Chaitra', 'Shukla', 'Purnima');

-- INSERT INTO shaswata_subscriptions (devotee_id, seva_id, subscription_type, seva_type) 
-- VALUES (2, 2, 'RATHOTSAVA', 'BRAHMACHARI');
