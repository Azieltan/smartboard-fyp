import { supabase } from '../lib/supabase';

export interface Friend {
    user_id: string;
    friend_id: string;
    status: 'pending' | 'accepted';
    created_at: string;
    friend_details?: any; // To store joined user data
}

export class FriendService {
    static async addFriend(userId: string, identifier: string): Promise<Friend> {
        // Try to find by ID first, then Email
        const { data: userData, error: userError } = await supabase
            .from('users')
            .select('user_id')
            .or(`user_id.eq.${identifier},email.eq.${identifier}`)
            .single();

        if (userError || !userData) {
            throw new Error('User not found');
        }

        const friendId = userData.user_id;

        if (friendId === userId) {
            throw new Error('Cannot add yourself as a friend');
        }

        const { data, error } = await supabase
            .from('friends')
            .insert([{ user_id: userId, friend_id: friendId, status: 'pending' }])
            .select()
            .single();

        if (error) {
            throw new Error(error.message);
        }

        return data as Friend;
    }

    static async getFriends(userId: string): Promise<Friend[]> {
        // Get friends where user is sender
        const { data: sent, error: sentError } = await supabase
            .from('friends')
            .select('*, friend:users!friend_id(*)')
            .eq('user_id', userId)
            .eq('status', 'accepted');

        // Get friends where user is receiver
        const { data: received, error: receivedError } = await supabase
            .from('friends')
            .select('*, friend:users!user_id(*)')
            .eq('friend_id', userId)
            .eq('status', 'accepted');

        if (sentError || receivedError) {
            throw new Error('Failed to fetch friends');
        }

        const friends = [
            ...(sent || []).map(f => ({ ...f, friend_details: f.friend })),
            ...(received || []).map(f => ({ ...f, friend_details: f.friend }))
        ];

        return friends as Friend[];
    }
}
