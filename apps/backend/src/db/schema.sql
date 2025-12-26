-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- RESET: Drop existing tables to ensure clean slate (Order matters due to foreign keys)
drop table if exists subtasks cascade;
drop table if exists messages cascade;
drop table if exists chats cascade;
drop table if exists tickets cascade;
drop table if exists reminders cascade;
drop table if exists tasks cascade;
drop table if exists calendar_events cascade;
drop table if exists group_members cascade;
drop table if exists groups cascade;
drop table if exists users cascade;

-- Users Table
create table users (
  user_id text primary key, -- Firebase UID
  user_name text not null,
  email text not null unique,
  password_hash text not null, -- Added for custom auth
  role text check (role in ('admin', 'owner', 'member')) default 'member',
  created_at timestamp with time zone default now()
);

-- Groups Table
create table groups (
  group_id uuid primary key default uuid_generate_v4(),
  name text not null,
  join_code text unique, -- Code to join
  requires_approval boolean default false, -- If true, owner must approve join requests
  user_id text references users(user_id), -- Owner
  created_at timestamp with time zone default now()
);

-- Group Members Table
create table group_members (
  group_id uuid references groups(group_id) on delete cascade,
  user_id text references users(user_id) on delete cascade,
  role text check (role in ('owner', 'admin', 'member')) default 'member',
  status text check (status in ('active', 'pending')) default 'active', -- Membership status
  joined_at timestamp with time zone default now(),
  primary key (group_id, user_id)
);

-- Calendar Events
create table calendar_events (
  event_id uuid primary key default uuid_generate_v4(),
  title text not null,
  start_time timestamp with time zone not null,
  end_time timestamp with time zone not null,
  creator text references users(user_id),
  user_id text references users(user_id)
);

-- Tasks Table
create table tasks (
  task_id uuid primary key default uuid_generate_v4(),
  title text not null,
  description text,
  due_date timestamp with time zone,
  created_by text references users(user_id),
  edited_by text references users(user_id),
  user_id text references users(user_id), -- Assignee/Owner
  group_id uuid references groups(group_id) on delete set null,
  status text check (status in ('todo', 'in_progress', 'in_review', 'done')) default 'todo',
  priority text check (priority in ('low', 'medium', 'high')) default 'medium',
  created_at timestamp with time zone default now()
);

-- Reminders
create table reminders (
  reminder_id uuid primary key default uuid_generate_v4(),
  task_id uuid references tasks(task_id) on delete cascade,
  event_id uuid references calendar_events(event_id) on delete cascade,
  remind_time timestamp with time zone not null,
  status text check (status in ('pending', 'sent')) default 'pending'
);

-- Tickets (Support)
create table tickets (
  ticket_id uuid primary key default uuid_generate_v4(),
  ticket_title text not null,
  description text,
  time_stamp timestamp with time zone default now(),
  admin_id text references users(user_id),
  user_id text references users(user_id),
  status text check (status in ('open', 'closed')) default 'open'
);

-- Chats (Optional container, or just use Groups)
create table chats (
  chat_id uuid primary key default uuid_generate_v4(),
  group_id uuid references groups(group_id) on delete cascade,
  created_date timestamp with time zone default now()
);

-- Messages
create table messages (
  message_id uuid primary key default uuid_generate_v4(),
  chat_id uuid references chats(chat_id) on delete cascade,
  user_id text references users(user_id),
  content text not null,
  send_time timestamp with time zone default now()
);

-- Subtasks (Extra feature not in ERD but good to keep)
create table subtasks (
  subtask_id uuid primary key default uuid_generate_v4(),
  task_id uuid references tasks(task_id) on delete cascade,
  title text not null,
  is_completed boolean default false
);

-- Friends Table
create table friends (
  user_id text references users(user_id),
  friend_id text references users(user_id),
  status text check (status in ('pending', 'accepted')) default 'pending',
  created_at timestamp with time zone default now(),
  primary key (user_id, friend_id)
);

-- Notifications Table
create table notifications (
  id uuid primary key default uuid_generate_v4(),
  user_id text references users(user_id) not null,
  type text not null, -- 'group_invite', 'system', 'message', 'friend_request'
  title text not null,
  message text,
  metadata jsonb, -- link, groupId, etc.
  read boolean default false,
  created_at timestamp with time zone default now()
);

-- Task Submissions Table (for Review Workflow)
create table task_submissions (
  submission_id uuid primary key default uuid_generate_v4(),
  task_id uuid references tasks(task_id) on delete cascade,
  user_id text references users(user_id), -- Who submitted
  content text,
  attachments text[], -- Array of URLs
  status text check (status in ('pending', 'approved', 'rejected')) default 'pending',
  feedback text,
  submitted_at timestamp with time zone default now(),
  reviewed_at timestamp with time zone
);
