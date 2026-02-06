-- ============================================
-- SMARTBOARD DATABASE UPDATE SCRIPT
-- ============================================
-- Run this script in your Supabase SQL Editor to apply all recent schema changes.

-- 1. Create Notifications Table (Fixes 500 Internal Server Error)
create table if not exists notifications (
  id uuid default uuid_generate_v4() primary key,
  user_id text references users(user_id) on delete cascade not null,
  type text not null,
  title text not null,
  message text,
  metadata jsonb,
  read boolean default false,
  created_at timestamp with time zone default now() not null
);

-- Enable RLS for notifications
alter table notifications enable row level security;
create policy "Users can view their own notifications"
  on notifications for select
  using (auth.uid()::text = user_id or user_id = current_setting('request.jwt.claim.sub', true));

-- create indexes for notifications
create index if not exists idx_notifications_user_id on notifications(user_id);
create index if not exists idx_notifications_unread on notifications(user_id) where read = false;


-- 2. Add 'reminder_sent' to tasks (For Due Date Reminders)
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS reminder_sent BOOLEAN DEFAULT FALSE;


-- 3. Create Automation Requests Table (For Smarty n8n Integration)
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


-- 4. Create Task Submissions Table (For Task Review)
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

-- Update Task Status Constraint
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'task_status_new') THEN
        ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_status_check;
        ALTER TABLE tasks ADD CONSTRAINT tasks_status_check 
            CHECK (status IN ('todo', 'in_progress', 'in_review', 'done'));
    END IF;
END
$$;
