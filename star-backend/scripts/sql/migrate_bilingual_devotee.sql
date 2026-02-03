-- S.T.A.R. Backend - Bilingual Devotee Fields Migration
-- =========================================================
-- This migration adds Kannada name fields to the devotees table.
-- Run this AFTER taking a backup of your database.

-- Step 1: Rename existing name column to English suffix
ALTER TABLE devotees RENAME COLUMN full_name TO full_name_en;

-- Step 2: Add Kannada name column
ALTER TABLE devotees ADD COLUMN full_name_kn TEXT;

-- Step 3: Rename gothra column to English suffix
ALTER TABLE devotees RENAME COLUMN gothra TO gothra_en;

-- Step 4: Add Kannada gothra column
ALTER TABLE devotees ADD COLUMN gothra_kn TEXT;

-- Optional: Copy English values to Kannada as defaults (can be updated later)
-- UPDATE devotees SET full_name_kn = full_name_en, gothra_kn = gothra_en;
