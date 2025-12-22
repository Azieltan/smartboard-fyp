-- ============================================
-- SMARTBOARD MIGRATION SCRIPT (FIX GAPS)
-- ============================================

-- 1. Fix GROUPS Table
-- Add columns for Join Codes, DM flagging, and Approval Logic
ALTER TABLE groups 
ADD COLUMN IF NOT EXISTS join_code TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS requires_approval BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS is_dm BOOLEAN DEFAULT false;

-- 2. Fix GROUP_MEMBERS Table
-- Add status column to handle 'pending' vs 'active' members
ALTER TABLE group_members 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

-- 3. Fix CALENDAR_EVENTS Table
-- Add columns for Sharing logic
ALTER TABLE calendar_events 
ADD COLUMN IF NOT EXISTS shared_with_group_id UUID REFERENCES groups(group_id),
ADD COLUMN IF NOT EXISTS shared_with JSONB DEFAULT '[]'::jsonb;

-- 4. Fix TASKS Table (Optional Polish)
-- Ensure priority and status have default values if not already set
ALTER TABLE tasks 
ALTER COLUMN status SET DEFAULT 'todo',
ALTER COLUMN priority SET DEFAULT 'medium';

-- ============================================
-- VERIFICATION
-- ============================================
-- The following lines are just for your confirmation, they don't change data.
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name IN ('groups', 'group_members', 'calendar_events');
