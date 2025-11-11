-- Migration 003: Add Interviewer Team Fields
-- Adds fields from TheInterviewTeam.xlsx to interviewers table
-- These ALTER TABLE statements are safe to run multiple times because:
-- 1. The database plugin catches "column already exists" errors
-- 2. Indexes with IF NOT EXISTS won't fail on re-run

-- Onboarding & Dates
ALTER TABLE interviewers ADD COLUMN date_in TEXT;

-- Management & Organization
ALTER TABLE interviewers ADD COLUMN manager TEXT;
ALTER TABLE interviewers ADD COLUMN check_manager INTEGER DEFAULT 0;
ALTER TABLE interviewers ADD COLUMN org TEXT;

-- Interview Profiles (boolean flags for different interview types)
ALTER TABLE interviewers ADD COLUMN profile_backend INTEGER DEFAULT 0;
ALTER TABLE interviewers ADD COLUMN profile_big_data INTEGER DEFAULT 0;
ALTER TABLE interviewers ADD COLUMN profile_frontend INTEGER DEFAULT 0;
ALTER TABLE interviewers ADD COLUMN profile_fullstack INTEGER DEFAULT 0;
ALTER TABLE interviewers ADD COLUMN profile_sre INTEGER DEFAULT 0;
ALTER TABLE interviewers ADD COLUMN profile_cse INTEGER DEFAULT 0;
ALTER TABLE interviewers ADD COLUMN profile_ml INTEGER DEFAULT 0;
ALTER TABLE interviewers ADD COLUMN profile_em INTEGER DEFAULT 0;

-- Level & Experience
ALTER TABLE interviewers ADD COLUMN max_level INTEGER;
ALTER TABLE interviewers ADD COLUMN check_level TEXT;

-- Availability & Status
ALTER TABLE interviewers ADD COLUMN pause_until TEXT;
ALTER TABLE interviewers ADD COLUMN is_shadowing INTEGER DEFAULT 0;
ALTER TABLE interviewers ADD COLUMN onboarding_completed INTEGER DEFAULT 0;

-- Work Mode
ALTER TABLE interviewers ADD COLUMN is_remote INTEGER DEFAULT 0;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_interviewers_org ON interviewers(org);
CREATE INDEX IF NOT EXISTS idx_interviewers_manager ON interviewers(manager);
CREATE INDEX IF NOT EXISTS idx_interviewers_max_level ON interviewers(max_level);
CREATE INDEX IF NOT EXISTS idx_interviewers_pause_until ON interviewers(pause_until);
