-- Add 'nutrition check' or 'in_review' status to tasks check constraint if possible, 
-- or just drop and recreate constraint. 
-- For simplicity in this environment, we will try to update the check constraint.

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'task_status_new') THEN
        -- We won't change the enum type if it is hardcoded in check constraint.
        -- We will drop the constraint and add a new one.
        ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_status_check;
        ALTER TABLE tasks ADD CONSTRAINT tasks_status_check 
            CHECK (status IN ('todo', 'in_progress', 'in_review', 'done'));
    END IF;
END
$$;

-- Create Task Submissions Table
CREATE TABLE IF NOT EXISTS task_submissions (
    submission_id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    task_id uuid REFERENCES tasks(task_id) ON DELETE CASCADE,
    user_id text REFERENCES users(user_id), -- Submitter
    content text,
    attachments jsonb, -- Array of strings (URLs)
    status text CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
    feedback text, -- From reviewer
    submitted_at timestamp with time zone DEFAULT now(),
    reviewed_at timestamp with time zone
);

-- Index
CREATE INDEX IF NOT EXISTS idx_task_submissions_task_id ON task_submissions(task_id);
