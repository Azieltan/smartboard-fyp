-- Supabase Auth (UUID) schema for Smartboard backend (Option B)
-- WARNING: This script DROPS existing tables in public schema.
-- Use only if you are OK losing existing data, or run on a new Supabase project.

create extension if not exists "uuid-ossp";

-- Drop in dependency order
drop table if exists subtasks cascade;
drop table if exists reminders cascade;
drop table if exists messages cascade;
drop table if exists chats cascade;
drop table if exists friends cascade;
drop table if exists tasks cascade;
drop table if exists calendar_events cascade;
drop table if exists group_members cascade;
drop table if exists groups cascade;
drop table if exists users cascade;

-- Users: profile table that mirrors Supabase Auth users
-- auth.users(id) is UUID
create table users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  user_name text not null,
  email text not null unique,
  role text check (role in ('admin', 'owner', 'member')) default 'member',
  created_at timestamp with time zone default now()
);

-- Groups
create table groups (
  group_id uuid primary key default uuid_generate_v4(),
  name text not null,
  owner_id uuid not null references users(user_id) on delete cascade,
  join_code text unique,
  requires_approval boolean default false,
  is_dm boolean default false,
  created_at timestamp with time zone default now()
);

-- Group members
create table group_members (
  group_id uuid references groups(group_id) on delete cascade,
  user_id uuid references users(user_id) on delete cascade,
  role text check (role in ('admin', 'member')) default 'member',
  status text check (status in ('active', 'pending')) default 'active',
  joined_at timestamp with time zone default now(),
  primary key (group_id, user_id)
);

-- Chats
create table chats (
  chat_id uuid primary key default uuid_generate_v4(),
  group_id uuid references groups(group_id) on delete cascade,
  created_at timestamp with time zone default now()
);

-- Messages
create table messages (
  message_id uuid primary key default uuid_generate_v4(),
  chat_id uuid references chats(chat_id) on delete cascade,
  user_id uuid references users(user_id) on delete set null,
  content text not null,
  created_at timestamp with time zone default now()
);

-- Tasks
create table tasks (
  task_id uuid primary key default uuid_generate_v4(),
  title text not null,
  description text,
  due_date timestamp with time zone,
  owner_id uuid not null references users(user_id) on delete cascade,
  group_id uuid references groups(group_id) on delete set null,
  status text check (status in ('todo', 'in_progress', 'done')) default 'todo',
  priority text check (priority in ('low', 'medium', 'high')) default 'medium',
  created_at timestamp with time zone default now()
);

-- Calendar events
-- shared_with: list of user UUIDs as text[] (stringified) for lightweight sharing.
create table calendar_events (
  event_id uuid primary key default uuid_generate_v4(),
  title text not null,
  start_time timestamp with time zone not null,
  end_time timestamp with time zone not null,
  creator_id uuid not null references users(user_id) on delete cascade,
  shared_group_id uuid references groups(group_id) on delete set null,
  shared_with text[] default array[]::text[],
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

-- Subtasks
create table subtasks (
  subtask_id uuid primary key default uuid_generate_v4(),
  task_id uuid references tasks(task_id) on delete cascade,
  title text not null,
  is_completed boolean default false
);

-- Friends (request-based)
create table friends (
  id uuid primary key default uuid_generate_v4(),
  requester_id uuid not null references users(user_id) on delete cascade,
  addressee_id uuid not null references users(user_id) on delete cascade,
  status text check (status in ('pending', 'accepted')) default 'pending',
  created_at timestamp with time zone default now(),
  unique(requester_id, addressee_id)
);

-- Useful indexes
create index if not exists idx_group_members_user_id on group_members(user_id);
create index if not exists idx_tasks_owner_id on tasks(owner_id);
create index if not exists idx_messages_chat_id on messages(chat_id);
create index if not exists idx_calendar_events_creator_id on calendar_events(creator_id);
