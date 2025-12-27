import { supabase } from '../lib/supabase';
import { Server } from 'socket.io';

export interface Notification {
    id: string;
    user_id: string;
    type: string;
    title: string;
    message: string;
    metadata?: any;
    read: boolean;
    created_at: string;
}

let io: Server | null = null;

export class NotificationService {
    static setIO(socketIO: Server) {
        io = socketIO;
    }

    static async createNotification(
        userId: string,
        type: string,
        data: {
            title: string;
            message?: string;
            sender_id?: string;
            group_id?: string;
            chat_id?: string;
            action_url?: string;
            [key: string]: any;
        }
    ): Promise<Notification> {
        const { title, message, ...metadata } = data;

        // Construct metadata object from extra fields
        const meta = {
            ...metadata,
            sender_id: metadata.sender_id,
            group_id: metadata.group_id,
            chat_id: metadata.chat_id,
            action_url: metadata.action_url
        };

        const { data: notification, error } = await supabase
            .from('notifications')
            .insert([{
                user_id: userId,
                type,
                title,
                message,
                metadata: meta,
                read: false
            }])
            .select()
            .single();

        if (error) throw new Error(error.message);

        // Emit socket event for real-time pop-out
        if (io) {
            io.to(userId).emit('notification:new', notification);
            // Specific event types
            if (type === 'friend_request') io.to(userId).emit('notification:friend_request', notification);
            if (type === 'group_invite') io.to(userId).emit('notification:group_invite', notification);
        }

        return notification as Notification;
    }

    static async getUnreadNotifications(userId: string): Promise<Notification[]> {
        const { data, error } = await supabase
            .from('notifications')
            .select('*')
            .eq('user_id', userId)
            .eq('read', false)
            .order('created_at', { ascending: false });

        if (error) throw new Error(error.message);
        return (data || []) as Notification[];
    }

    static async getNotifications(userId: string): Promise<Notification[]> {
        const { data, error } = await supabase
            .from('notifications')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) throw new Error(error.message);
        return (data || []) as Notification[];
    }

    static async markAsRead(notificationId: string): Promise<void> {
        const { error } = await supabase
            .from('notifications')
            .update({ read: true })
            .eq('id', notificationId);

        if (error) throw new Error(error.message);
    }

    static async markAllAsRead(userId: string): Promise<void> {
        const { error } = await supabase
            .from('notifications')
            .update({ read: true })
            .eq('user_id', userId)
            .eq('read', false);

        if (error) throw new Error(error.message);
    }
    static async deleteNotification(notificationId: string): Promise<void> {
        const { error } = await supabase
            .from('notifications')
            .delete()
            .eq('id', notificationId);

        if (error) throw new Error(error.message);
    }
}

