import { supabase } from '../lib/supabase';

export interface Message {
    message_id: string;
    chat_id: string;
    user_id: string;
    content: string;
    send_time: string;
}

export interface Chat {
    chat_id: string;
    group_id: string;
    send_time: string; // Using send_time for compatibility with schema.sql chats
}

export class ChatService {
    static async getMessages(chatId: string): Promise<any[]> {
        const { data, error } = await supabase
            .from('messages')
            .select('*, users(user_name, email)') // users!inner? maybe not if system messages exist
            .eq('chat_id', chatId)
            .order('send_time', { ascending: true });

        if (error) {
            throw new Error(error.message);
        }

        return (data || []).map((m: any) => ({
            ...m,
            user_name: m.users?.user_name,
            email: m.users?.email
        }));
    }

    static async sendMessage(chatId: string, userId: string, content: string): Promise<any> {
        const { data, error } = await supabase
            .from('messages')
            .insert([{ chat_id: chatId, user_id: userId, content, send_time: new Date().toISOString() }])
            .select('*, users(user_name, email)')
            .single();

        if (error) {
            throw new Error(error.message);
        }

        return {
            ...data,
            user_name: (data as any).users?.user_name,
            email: (data as any).users?.email
        };
    }

    static async createChat(groupId: string): Promise<any> {
        const { data, error } = await supabase
            .from('chats')
            .insert([{ group_id: groupId }])
            .select()
            .single();

        if (error) {
            throw new Error(error.message);
        }

        return data;
    }

    static async getChatByGroupId(groupId: string): Promise<any | null> {
        const { data, error } = await supabase
            .from('chats')
            .select('*')
            .eq('group_id', groupId)
            .limit(1)
            .maybeSingle();

        if (error) {
            console.error(`[ChatService] getChatByGroupId error for ${groupId}:`, error);
            throw new Error(error.message);
        }

        return data;
    }
}
