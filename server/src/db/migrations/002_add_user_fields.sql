-- Add additional fields to users table for Issue #53
-- Adds picture URL and last_login_at tracking

-- Note: These columns should already exist from 001_initial.sql
-- This migration is kept for backward compatibility with databases
-- that were created before these columns were added to the initial schema.
-- SQLite doesn't support IF NOT EXISTS on ALTER TABLE, so we wrap in error handling.

-- Create index for login activity queries (safe to run multiple times)
CREATE INDEX IF NOT EXISTS idx_users_last_login ON users(last_login_at);
