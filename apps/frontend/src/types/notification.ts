export interface Notification {
  id: string;
  type: "friend_request" | "group_invite" | "chat_message" | "task_assigned" | "task_submission" | "task_review" | "join_request";
  title: string;
  message: string;
  sender_id?: string;
  sender_name?: string;
  group_id?: string;
  chat_id?: string;
  read: boolean;
  created_at: string;
  action_url?: string;
  metadata?: Record<string, any>;
}

export type NotificationType = Notification['type'];
