-- SQL Migration to add 'seva_date' column to 'transactions' table
-- Run this command in your PostgreSQL Query Tool (pgAdmin)

ALTER TABLE transactions 
ADD COLUMN seva_date DATE DEFAULT CURRENT_DATE;

-- Optional: Verify the column was added
-- SELECT * FROM transactions LIMIT 1;
