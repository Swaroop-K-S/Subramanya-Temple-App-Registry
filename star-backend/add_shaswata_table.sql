-- =============================================================================
-- S.T.A.R. Database Migration - Add Shaswata Subscriptions Table
-- =============================================================================
-- Run this SQL script in PostgreSQL to add the shaswata_subscriptions table
-- Execute: psql -U postgres -d star_temple_db -f add_shaswata_table.sql
-- =============================================================================

-- Create the shaswata_subscriptions table
CREATE TABLE IF NOT EXISTS shaswata_subscriptions (
    id SERIAL PRIMARY KEY,
    
    -- Foreign Keys
    devotee_id INTEGER NOT NULL REFERENCES devotees(id) ON DELETE CASCADE,
    seva_id INTEGER NOT NULL REFERENCES seva_catalog(id) ON DELETE RESTRICT,
    
    -- Subscription Type: LUNAR or GREGORIAN
    subscription_type VARCHAR(20) NOT NULL DEFAULT 'LUNAR',
    
    -- Gregorian Date Fields (for birthdays/fixed dates)
    event_day INTEGER CHECK (event_day >= 1 AND event_day <= 31),
    event_month INTEGER CHECK (event_month >= 1 AND event_month <= 12),
    
    -- Lunar Date Fields (for Hindu Panchanga-based events)
    maasa VARCHAR(30),      -- Hindu month (Chaitra to Phalguna)
    paksha VARCHAR(10),     -- Shukla or Krishna
    tithi VARCHAR(20),      -- Lunar day (Pratipada to Purnima/Amavasya)
    nakshatra_trigger VARCHAR(30),  -- Optional: specific nakshatra
    
    -- Tracking & Metadata
    last_performed_year INTEGER,    -- Year when puja was last performed
    notes TEXT,                     -- Additional notes
    
    -- Audit columns
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Constraints
    CONSTRAINT check_subscription_type CHECK (
        subscription_type IN ('LUNAR', 'GREGORIAN')
    ),
    
    -- If LUNAR, ensure lunar fields are provided
    CONSTRAINT check_lunar_fields CHECK (
        subscription_type != 'LUNAR' OR (maasa IS NOT NULL AND paksha IS NOT NULL AND tithi IS NOT NULL)
    ),
    
    -- If GREGORIAN, ensure date fields are provided
    CONSTRAINT check_gregorian_fields CHECK (
        subscription_type != 'GREGORIAN' OR (event_day IS NOT NULL AND event_month IS NOT NULL)
    )
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_shaswata_devotee ON shaswata_subscriptions(devotee_id);
CREATE INDEX IF NOT EXISTS idx_shaswata_seva ON shaswata_subscriptions(seva_id);
CREATE INDEX IF NOT EXISTS idx_shaswata_active ON shaswata_subscriptions(is_active);
CREATE INDEX IF NOT EXISTS idx_shaswata_type ON shaswata_subscriptions(subscription_type);
CREATE INDEX IF NOT EXISTS idx_shaswata_lunar ON shaswata_subscriptions(maasa, paksha, tithi) WHERE subscription_type = 'LUNAR';
CREATE INDEX IF NOT EXISTS idx_shaswata_gregorian ON shaswata_subscriptions(event_month, event_day) WHERE subscription_type = 'GREGORIAN';

-- Add notes column to transactions if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'transactions' AND column_name = 'notes'
    ) THEN
        ALTER TABLE transactions ADD COLUMN notes TEXT;
    END IF;
END $$;

-- Comment on table
COMMENT ON TABLE shaswata_subscriptions IS 'Perpetual (Shaswata) Puja subscriptions that recur annually based on lunar or Gregorian dates';

-- =============================================================================
-- Sample Data for Testing (Optional - uncomment to use)
-- =============================================================================

-- Insert a sample LUNAR subscription (for testing)
-- INSERT INTO shaswata_subscriptions (devotee_id, seva_id, subscription_type, maasa, paksha, tithi, notes)
-- VALUES (1, 7, 'LUNAR', 'Chaitra', 'Shukla', 'Panchami', 'Test lunar subscription');

-- Insert a sample GREGORIAN subscription (for testing)
-- INSERT INTO shaswata_subscriptions (devotee_id, seva_id, subscription_type, event_day, event_month, notes)
-- VALUES (1, 7, 'GREGORIAN', 25, 12, 'Test birthday subscription');

COMMIT;

-- =============================================================================
-- Verification Query
-- =============================================================================
-- Run this to verify the table was created correctly:
-- SELECT column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'shaswata_subscriptions';
