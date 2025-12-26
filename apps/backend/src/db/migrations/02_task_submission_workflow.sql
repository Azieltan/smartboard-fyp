-- Migration: Add Task Review Workflow
-- 1. Update tasks status check constraint
ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_status_check;
ALTER TABLE tasks ADD CONSTRAINT tasks_status_check CHECK (status IN ('todo', 'in_progress', 'in_review', 'done'));

-- 2. Create task_submissions table
CREATE TABLE IF NOT EXISTS task_submissions (
  submission_id uuid primary key default uuid_generate_v4(),
  task_id uuid references tasks(task_id) on delete cascade,
  user_id text references users(user_id),
  content text,
  attachments text[],
  status text check (status in ('pending', 'approved', 'rejected')) default 'pending',
  feedback text,
  submitted_at timestamp with time zone default now(),
  reviewed_at timestamp with time zone
);
