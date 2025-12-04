export interface User {
    user_id: string; // Firebase UID
    username: string;
    email: string;
    role: 'admin' | 'owner' | 'member';
    created_at?: Date;
}

export interface Task {
    task_id: string;
    title: string;
    description?: string;
    due_date?: Date;
    created_by?: string;
    edited_by?: string;
    user_id?: string;
    group_id?: string;
    status: 'todo' | 'in_progress' | 'done';
    priority: 'low' | 'medium' | 'high';
    created_at?: Date;
}

export interface Group {
    group_id: string;
    group_name: string;
    owner_id: string;
    created_at?: Date;
}

export interface SubTask {
    subtask_id: string;
    task_id: string;
    title: string;
    is_completed: boolean;
}

export interface ActivityLog {
    log_id: string;
    task_id: string;
    uploaded_at: Date;
}

// --- Chat & Messaging ---
export interface Message {
    message_id: string;
    group_id: string;
    user_id: string;
    content: string;
    timestamp: Date;
    attachments?: string[]; // URLs
}

// --- Social & Groups ---
export interface FriendRequest {
    request_id: string;
    from_user_id: string;
    to_user_id: string;
    status: 'pending' | 'accepted' | 'rejected';
    created_at: Date;
}

export interface GroupMember {
    group_id: string;
    user_id: string;
    role: 'owner' | 'admin' | 'member';
    joined_at: Date;
}

export interface GroupWithMembers extends Group {
    members: GroupMember[];
}
