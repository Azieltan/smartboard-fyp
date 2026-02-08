-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.activity_logs (
  log_id uuid NOT NULL DEFAULT uuid_generate_v4(),
  task_id uuid,
  user_id text,
  action text NOT NULL,
  timestamp timestamp with time zone DEFAULT now(),
  CONSTRAINT activity_logs_pkey PRIMARY KEY (log_id)
);
CREATE TABLE public.automation_requests (
  automation_id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id text NOT NULL,
  raw_text text NOT NULL,
  summary text,
  payload jsonb,
  status character varying NOT NULL DEFAULT 'pending'::character varying,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT automation_requests_pkey PRIMARY KEY (automation_id),
  CONSTRAINT automation_requests_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id)
);
CREATE TABLE public.calendar_events (
  event_id uuid NOT NULL DEFAULT uuid_generate_v4(),
  title text NOT NULL,
  start_time timestamp with time zone NOT NULL,
  end_time timestamp with time zone NOT NULL,
  creator text,
  user_id text,
  shared_with_group_id uuid,
  shared_with jsonb DEFAULT '[]'::jsonb,
  description text,
  CONSTRAINT calendar_events_pkey PRIMARY KEY (event_id),
  CONSTRAINT calendar_events_shared_with_group_id_fkey FOREIGN KEY (shared_with_group_id) REFERENCES public.groups(group_id),
  CONSTRAINT calendar_events_creator_fkey FOREIGN KEY (creator) REFERENCES public.users(user_id),
  CONSTRAINT calendar_events_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id)
);
CREATE TABLE public.chats (
  chat_id uuid NOT NULL DEFAULT uuid_generate_v4(),
  group_id uuid,
  created_date timestamp with time zone DEFAULT now(),
  CONSTRAINT chats_pkey PRIMARY KEY (chat_id),
  CONSTRAINT chats_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.groups(group_id)
);
CREATE TABLE public.file_submissions (
  file_id uuid NOT NULL DEFAULT uuid_generate_v4(),
  task_id uuid,
  user_id text,
  file_url text NOT NULL,
  uploaded_at timestamp with time zone DEFAULT now(),
  CONSTRAINT file_submissions_pkey PRIMARY KEY (file_id)
);
CREATE TABLE public.friend_requests (
  request_id uuid NOT NULL DEFAULT uuid_generate_v4(),
  from_user_id text,
  to_user_id text,
  status text DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'accepted'::text, 'rejected'::text])),
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT friend_requests_pkey PRIMARY KEY (request_id)
);
CREATE TABLE public.friends (
  user_id_1 text NOT NULL,
  user_id_2 text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT friends_pkey PRIMARY KEY (user_id_1, user_id_2)
);
CREATE TABLE public.group_members (
  group_id uuid NOT NULL,
  user_id text NOT NULL,
  role text DEFAULT 'member'::text CHECK (role = ANY (ARRAY['owner'::text, 'admin'::text, 'member'::text])),
  joined_at timestamp with time zone DEFAULT now(),
  status text DEFAULT 'active'::text,
  can_manage_members boolean DEFAULT false,
  CONSTRAINT group_members_pkey PRIMARY KEY (group_id, user_id),
  CONSTRAINT group_members_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.groups(group_id),
  CONSTRAINT group_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id)
);
CREATE TABLE public.groups (
  group_id uuid NOT NULL DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  user_id text,
  created_at timestamp with time zone DEFAULT now(),
  join_code text UNIQUE,
  requires_approval boolean DEFAULT false,
  is_dm boolean DEFAULT false,
  CONSTRAINT groups_pkey PRIMARY KEY (group_id),
  CONSTRAINT groups_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id)
);
CREATE TABLE public.messages (
  message_id uuid NOT NULL DEFAULT uuid_generate_v4(),
  chat_id uuid,
  user_id text,
  content text NOT NULL,
  send_time timestamp with time zone DEFAULT now(),
  CONSTRAINT messages_pkey PRIMARY KEY (message_id),
  CONSTRAINT messages_chat_id_fkey FOREIGN KEY (chat_id) REFERENCES public.chats(chat_id),
  CONSTRAINT messages_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id)
);
CREATE TABLE public.notifications (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id text NOT NULL,
  type text NOT NULL,
  title text NOT NULL,
  message text,
  metadata jsonb,
  read boolean DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT notifications_pkey PRIMARY KEY (id),
  CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id)
);
CREATE TABLE public.reminders (
  reminder_id uuid NOT NULL DEFAULT uuid_generate_v4(),
  task_id uuid,
  event_id uuid,
  remind_time timestamp with time zone NOT NULL,
  status text DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'sent'::text])),
  CONSTRAINT reminders_pkey PRIMARY KEY (reminder_id),
  CONSTRAINT reminders_task_id_fkey FOREIGN KEY (task_id) REFERENCES public.tasks(task_id),
  CONSTRAINT reminders_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.calendar_events(event_id)
);
CREATE TABLE public.subtasks (
  subtask_id uuid NOT NULL DEFAULT uuid_generate_v4(),
  task_id uuid,
  title text NOT NULL,
  is_completed boolean DEFAULT false,
  description text,
  CONSTRAINT subtasks_pkey PRIMARY KEY (subtask_id),
  CONSTRAINT subtasks_task_id_fkey FOREIGN KEY (task_id) REFERENCES public.tasks(task_id)
);
CREATE TABLE public.task_assignees (
  task_id uuid NOT NULL,
  user_id text NOT NULL,
  CONSTRAINT task_assignees_pkey PRIMARY KEY (task_id, user_id)
);
CREATE TABLE public.task_submissions (
  submission_id uuid NOT NULL DEFAULT uuid_generate_v4(),
  task_id uuid,
  user_id text,
  content text,
  attachments ARRAY,
  status text DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text])),
  feedback text,
  submitted_at timestamp with time zone DEFAULT now(),
  reviewed_at timestamp with time zone,
  CONSTRAINT task_submissions_pkey PRIMARY KEY (submission_id),
  CONSTRAINT task_submissions_task_id_fkey FOREIGN KEY (task_id) REFERENCES public.tasks(task_id),
  CONSTRAINT task_submissions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id)
);
CREATE TABLE public.tasks (
  task_id uuid NOT NULL DEFAULT uuid_generate_v4(),
  title text NOT NULL,
  description text,
  due_date timestamp with time zone,
  created_by text,
  edited_by text,
  assignee_id text,
  group_id uuid,
  status text DEFAULT 'todo'::text CHECK (status = ANY (ARRAY['todo'::text, 'in_progress'::text, 'in_review'::text, 'done'::text])),
  priority text DEFAULT 'medium'::text CHECK (priority = ANY (ARRAY['low'::text, 'medium'::text, 'high'::text])),
  created_at timestamp with time zone DEFAULT now(),
  reminder_sent boolean DEFAULT false,
  depends_on uuid,
  CONSTRAINT tasks_pkey PRIMARY KEY (task_id),
  CONSTRAINT tasks_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(user_id),
  CONSTRAINT tasks_edited_by_fkey FOREIGN KEY (edited_by) REFERENCES public.users(user_id),
  CONSTRAINT tasks_assignee_id_fkey FOREIGN KEY (assignee_id) REFERENCES public.users(user_id),
  CONSTRAINT tasks_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.groups(group_id),
  CONSTRAINT tasks_depends_on_fkey FOREIGN KEY (depends_on) REFERENCES public.tasks(task_id)
);
CREATE TABLE public.tickets (
  ticket_id uuid NOT NULL DEFAULT uuid_generate_v4(),
  ticket_title text NOT NULL,
  description text,
  time_stamp timestamp with time zone DEFAULT now(),
  admin_id text,
  user_id text,
  status text DEFAULT 'open'::text CHECK (status = ANY (ARRAY['open'::text, 'closed'::text])),
  CONSTRAINT tickets_pkey PRIMARY KEY (ticket_id),
  CONSTRAINT tickets_admin_id_fkey FOREIGN KEY (admin_id) REFERENCES public.users(user_id),
  CONSTRAINT tickets_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id)
);
CREATE TABLE public.users (
  user_id text NOT NULL,
  user_name text NOT NULL,
  email text NOT NULL UNIQUE,
  role text DEFAULT 'member'::text CHECK (role = ANY (ARRAY['admin'::text, 'member'::text, 'systemadmin'::text])),
  created_at timestamp with time zone DEFAULT now(),
  password_hash text,
  CONSTRAINT users_pkey PRIMARY KEY (user_id)
);
