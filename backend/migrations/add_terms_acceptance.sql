-- Add terms_accepted_at column to users table
ALTER TABLE users
ADD COLUMN terms_accepted_at DATETIME DEFAULT NULL
AFTER status;
-- Index for faster queries on terms acceptance
CREATE INDEX idx_users_terms_accepted ON users(terms_accepted_at);