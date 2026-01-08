
-- Add attachments column to subtasks table
ALTER TABLE subtasks ADD COLUMN IF NOT EXISTS attachments TEXT[] DEFAULT '{}';
