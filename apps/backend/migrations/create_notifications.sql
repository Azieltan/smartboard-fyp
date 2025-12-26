-- Create Notifications Table
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

-- Enable RLS
alter table notifications enable row level security;

-- Policies
create policy "Users can view their own notifications"
  on notifications for select
  using (auth.uid()::text = user_id or user_id = current_setting('request.jwt.claim.sub', true));
  -- Note: The user_id in users table is text (Firebase UID?). 
  -- If we use Supabase Auth, auth.uid() is uuid.
  -- If we use Custom Auth (as seen in earlier files), we might not rely on RLS or need custom logic.
  -- Given the backend uses service_role key, it bypasses RLS for API calls.
  -- So we just need the table for the backend to work.

-- Indexes
create index if not exists idx_notifications_user_id on notifications(user_id);
create index if not exists idx_notifications_unread on notifications(user_id) where read = false;
