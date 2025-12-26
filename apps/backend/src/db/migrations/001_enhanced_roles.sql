-- Migration: Add enhanced role system for groups
-- Run this in Supabase SQL Editor

-- 1. Update role constraint to include 'owner'
ALTER TABLE group_members DROP CONSTRAINT IF EXISTS group_members_role_check;
ALTER TABLE group_members ADD CONSTRAINT group_members_role_check 
  CHECK (role IN ('owner', 'admin', 'member'));

-- 2. Add permission column for admins
ALTER TABLE group_members ADD COLUMN IF NOT EXISTS can_manage_members BOOLEAN DEFAULT false;

-- 3. Update existing group creators to be 'owner' instead of 'admin'
-- This updates each group's creator (stored in groups.user_id) to have 'owner' role
UPDATE group_members gm
SET role = 'owner'
FROM groups g
WHERE gm.group_id = g.group_id
  AND gm.user_id = g.user_id
  AND gm.role = 'admin'
  AND g.is_dm = false;

-- 4. Create index for faster permission lookups
CREATE INDEX IF NOT EXISTS idx_group_members_role ON group_members(role);
CREATE INDEX IF NOT EXISTS idx_group_members_can_manage ON group_members(can_manage_members) WHERE can_manage_members = true;
