-- ============================================
-- SMARTBOARD DATABASE FIX SCRIPT (ROBUST)
-- ============================================

-- 1. Fix Notifications Table
-- Drop policy first to avoid "already exists" error
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;

-- Ensure table exists
CREATE TABLE IF NOT EXISTS notifications (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id text REFERENCES users(user_id) ON DELETE CASCADE NOT NULL,
  type text NOT NULL,
  title text NOT NULL,
  message text,
  metadata jsonb,
  read boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Ensure all columns exist (idempotent updates)
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS user_id text REFERENCES users(user_id) ON DELETE CASCADE;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS type text;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS title text;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS message text;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS metadata jsonb;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS read boolean DEFAULT false;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS created_at timestamp with time zone DEFAULT now();

-- Re-enable RLS and Policy
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own notifications"
  ON notifications FOR SELECT
  USING (auth.uid()::text = user_id OR user_id = current_setting('request.jwt.claim.sub', true));

-- Re-create indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id) WHERE read = false;


-- 2. Fix Tasks Table (Add reminder_sent)
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS reminder_sent BOOLEAN DEFAULT FALSE;


-- 3. Fix Automation Requests Table
CREATE TABLE IF NOT EXISTS automation_requests (
  automation_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL REFERENCES users(user_id),
  raw_text TEXT NOT NULL,
  summary TEXT,
  payload JSONB,
  status VARCHAR(20) NOT NULL DEFAULT 'pending', 
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_automation_requests_user ON automation_requests(user_id);


-- 4. Fix Task Submissions Table
CREATE TABLE IF NOT EXISTS task_submissions (
    submission_id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    task_id uuid REFERENCES tasks(task_id) ON DELETE CASCADE,
    user_id text REFERENCES users(user_id),
    content text,
    attachments jsonb,
    status text CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
    feedback text,
    submitted_at timestamp with time zone DEFAULT now(),
    reviewed_at timestamp with time zone
);
CREATE INDEX IF NOT EXISTS idx_task_submissions_task_id ON task_submissions(task_id);

-- 5. Fix Task Status Constraint
-- We drop and re-add to ensure it includes all required values
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'tasks_status_check' AND table_name = 'tasks'
    ) THEN
        ALTER TABLE tasks DROP CONSTRAINT tasks_status_check;
    END IF;
    
    ALTER TABLE tasks ADD CONSTRAINT tasks_status_check 
        CHECK (status IN ('todo', 'in_progress', 'in_review', 'done'));
END
$$;
