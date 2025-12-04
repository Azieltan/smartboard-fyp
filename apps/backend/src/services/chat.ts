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
    created_date: string;
}

export class ChatService {
    static async getMessages(chatId: string): Promise<Message[]> {
        const { data, error } = await supabase
            .from('messages')
            .select('*')
            .eq('chat_id', chatId)
            .order('send_time', { ascending: true });

        if (error) {
            throw new Error(error.message);
        }

        return data as Message[];
    }

    static async sendMessage(chatId: string, userId: string, content: string): Promise<Message> {
        const { data, error } = await supabase
            .from('messages')
            .insert([{ chat_id: chatId, user_id: userId, content }])
            .select()
            .single();

        if (error) {
            throw new Error(error.message);
        }

        return data as Message;
    }

    static async createChat(groupId: string): Promise<Chat> {
        const { data, error } = await supabase
            .from('chats')
            .insert([{ group_id: groupId }])
            .select()
            .single();

        if (error) {
            throw new Error(error.message);
        }

        return data as Chat;
    }

    static async getChatByGroupId(groupId: string): Promise<Chat | null> {
        const { data, error } = await supabase
            .from('chats')
            .select('*')
            .eq('group_id', groupId)
            .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 is "The result contains 0 rows"
            throw new Error(error.message);
        }

        return data as Chat | null;
    }
}
