-- Supabase Auth (UUID) schema for Smartboard backend (Option B)
-- WARNING: This script DROPS existing tables in public schema.
-- Run only if you are OK losing existing data, or run it on a new Supabase project.
-- Note: Supabase does not generally allow inserting into auth.users from SQL editor.
-- Create users via Supabase Auth UI/API (or your backend /auth/register), then profiles are synced.

-- ============================================
-- 1. EXTENSIONS
-- ============================================
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ============================================
-- 2. RESET (DROP TABLES)
-- ============================================
begin;
  drop table if exists subtasks cascade;
  drop table if exists messages cascade;
  drop table if exists chats cascade;
  drop table if exists tickets cascade;
  drop table if exists reminders cascade;
  drop table if exists tasks cascade;
  drop table if exists calendar_events cascade;
  drop table if exists group_members cascade;
  drop table if exists friends cascade;
  drop table if exists groups cascade;
  drop table if exists users cascade;
commit;

-- ============================================
-- 3. CREATE TABLES
-- ============================================
begin;

  -- USERS (Links to Supabase Auth)
  create table users (
    user_id uuid primary key references auth.users(id) on delete cascade,
    user_name text not null,
    email text not null unique,
    role text check (role in ('admin', 'member')) default 'member',
    created_at timestamptz default now(),
    updated_at timestamptz default now()
  );

  -- GROUPS
  create table groups (
    group_id uuid primary key default uuid_generate_v4(),
    name text not null,
    owner_id uuid not null references users(user_id),
    join_code text unique,
    requires_approval boolean default false,
    is_dm boolean default false,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
  );

  -- GROUP MEMBERS
  create table group_members (
    group_id uuid references groups(group_id) on delete cascade,
    user_id uuid references users(user_id) on delete cascade,
    role text check (role in ('admin', 'member')) default 'member',
    status text check (status in ('pending', 'active')) default 'active',
    joined_at timestamptz default now(),
    primary key (group_id, user_id)
  );

  -- FRIENDS
  create table friends (
    id uuid primary key default uuid_generate_v4(),
    requester_id uuid references users(user_id) on delete cascade,
    addressee_id uuid references users(user_id) on delete cascade,
    status text check (status in ('pending', 'accepted')) default 'pending',
    created_at timestamptz default now(),
    check (requester_id <> addressee_id),
    unique (requester_id, addressee_id)
  );

  -- CALENDAR EVENTS
  create table calendar_events (
    event_id uuid primary key default uuid_generate_v4(),
    title text not null,
    start_time timestamptz not null,
    end_time timestamptz not null,
    creator_id uuid references users(user_id),
    shared_group_id uuid references groups(group_id),
    shared_with jsonb default '[]'::jsonb,
    created_at timestamptz default now(),
    updated_at timestamptz default now(),
    check (end_time > start_time)
  );

  -- TASKS
  create table tasks (
    task_id uuid primary key default uuid_generate_v4(),
    title text not null,
    description text,
    due_date timestamptz,
    owner_id uuid references users(user_id),
    group_id uuid references groups(group_id) on delete set null,
    status text check (status in ('todo', 'in_progress', 'done')) default 'todo',
    priority text check (priority in ('low', 'medium', 'high')) default 'medium',
    created_at timestamptz default now(),
    updated_at timestamptz default now()
  );

  -- REMINDERS
  create table reminders (
    reminder_id uuid primary key default uuid_generate_v4(),
    task_id uuid references tasks(task_id) on delete cascade,
    event_id uuid references calendar_events(event_id) on delete cascade,
    remind_time timestamptz not null,
    status text check (status in ('pending', 'sent')) default 'pending',
    check ( (task_id is not null and event_id is null) or (task_id is null and event_id is not null) )
  );

  -- TICKETS
  create table tickets (
    ticket_id uuid primary key default uuid_generate_v4(),
    title text not null,
    description text,
    user_id uuid references users(user_id),
    admin_id uuid references users(user_id),
    status text check (status in ('open', 'closed')) default 'open',
    created_at timestamptz default now()
  );

  -- CHATS
  create table chats (
    chat_id uuid primary key default uuid_generate_v4(),
    group_id uuid references groups(group_id) on delete cascade,
    created_at timestamptz default now()
  );

  -- MESSAGES
  create table messages (
    message_id uuid primary key default uuid_generate_v4(),
    chat_id uuid references chats(chat_id) on delete cascade,
    user_id uuid references users(user_id),
    content text not null,
    created_at timestamptz default now()
  );

  -- SUBTASKS
  create table subtasks (
    subtask_id uuid primary key default uuid_generate_v4(),
    task_id uuid references tasks(task_id) on delete cascade,
    title text not null,
    is_completed boolean default false
  );

  -- INDEXES
  create index on tasks(group_id);
  create index on tasks(owner_id);
  create index on calendar_events(start_time);
  create index on reminders(remind_time);
  create index on messages(chat_id);
  create index on group_members(user_id);
  create index on friends(requester_id);
  create index on friends(addressee_id);
  create index on calendar_events using gin (shared_with);

commit;

-- ==========================================
-- AUTOMATIC USER SYNC TRIGGER
-- (Runs automatically when a user signs up)
-- ==========================================

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (user_id, user_name, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.email,
    'member'
  )
  on conflict (user_id)
  do update set
    email = excluded.email,
    user_name = excluded.user_name,
    updated_at = now();

  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
