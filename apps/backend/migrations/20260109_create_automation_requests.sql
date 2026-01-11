-- Create automation_requests table for n8n orchestration flow
CREATE TABLE IF NOT EXISTS automation_requests (
  automation_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL REFERENCES users(user_id),
  raw_text TEXT NOT NULL,
  summary TEXT,
  payload JSONB,
  status VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending, confirmed, executing, done, failed
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add index for user_id and status
CREATE INDEX IF NOT EXISTS idx_automation_requests_user ON automation_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_automation_requests_status ON automation_requests(status);
