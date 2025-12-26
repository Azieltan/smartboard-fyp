import { supabase } from '../lib/supabase';

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

export class NotificationService {
    static async createNotification(
        userId: string,
        type: string,
        title: string,
        message?: string,
        metadata?: any
    ): Promise<Notification> {
        const { data, error } = await supabase
            .from('notifications')
            .insert([{
                user_id: userId,
                type,
                title,
                message,
                metadata,
                read: false
            }])
            .select()
            .single();

        if (error) throw new Error(error.message);
        return data;
    }

    static async getNotifications(userId: string): Promise<Notification[]> {
        const { data, error } = await supabase
            .from('notifications')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) throw new Error(error.message);
        return data || [];
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
}
