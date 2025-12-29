import { supabase } from '../lib/supabase';
import { NotificationService } from './notification';

export interface Friend {
    id: string; // This helps the screen understand which friend request is which by giving it a clear ID.
    from_user_id: string;
    to_user_id: string;
    status: 'pending' | 'accepted' | 'rejected';
    created_at: string;
    friend_details?: any;
}

export class FriendService {
    static async addFriend(userId: string, identifier: string): Promise<any> {
        // Search for the person you are trying to add in our system.
        const { data: userData, error: userError } = await supabase
            .from('users')
            .select('user_id')
            .or(`user_id.eq.${identifier},email.eq.${identifier}`)
            .single();

        if (userError || !userData) {
            throw new Error('User not found');
        }

        const targetFriendId = userData.user_id;
        if (targetFriendId === userId) throw new Error('Cannot add yourself');

        // Check if you have already sent a request to this person to avoid duplicates.
        const { data: existing } = await supabase
            .from('friend_requests')
            .select('*')
            .or(`and(from_user_id.eq.${userId},to_user_id.eq.${targetFriendId}),and(from_user_id.eq.${targetFriendId},to_user_id.eq.${userId})`)
            .maybeSingle();

        if (existing) throw new Error('Friend request already exists');

        const { data, error } = await supabase
            .from('friend_requests')
            .insert([{ from_user_id: userId, to_user_id: targetFriendId, status: 'pending' }])
            .select()
            .single();

        if (error) throw new Error(error.message);

        // Send a notification to let the other person know you want to connect.
        try {
            await NotificationService.createNotification(
                targetFriendId,
                'friend_request',
                {
                    title: 'New Friend Request',
                    message: 'You have a pending friend request',
                    sender_id: userId
                }
            );
        } catch (e) {
            console.error('Failed to send notification', e);
        }

        return data;
    }

    static async acceptFriend(relationshipId: string): Promise<void> {
        const { error } = await supabase
            .from('friend_requests')
            .update({ status: 'accepted' })
            .eq('request_id', relationshipId);

        if (error) throw new Error(error.message);
    }

    static async getFriends(userId: string): Promise<any[]> {
        // Get a list of all your friend requests and connections from the database.
        const { data: requests, error } = await supabase
            .from('friend_requests')
            .select('*')
            .or(`from_user_id.eq.${userId},to_user_id.eq.${userId}`);

        if (error) throw new Error(error.message);
        if (!requests || requests.length === 0) return [];

        // Make a list of all the people involved in these requests so we can identify them.
        const userIds = new Set<string>();
        requests.forEach(r => {
            userIds.add(r.from_user_id);
            userIds.add(r.to_user_id);
        });

        // specific details (like name and email) for everyone on that list.
        const { data: users, error: userErr } = await supabase
            .from('users')
            .select('user_id, user_name, email')
            .in('user_id', Array.from(userIds));

        if (userErr) throw new Error(userErr.message);

        const userMap = new Map(users?.map(u => [u.user_id, u]));

        // Organize the information so it looks good when displayed on your screen.
        return requests.map(r => {
            const isSender = r.from_user_id === userId;
            const otherUserId = isSender ? r.to_user_id : r.from_user_id;
            const otherUser = userMap.get(otherUserId);

            return {
                id: r.request_id,
                relationship_id: r.request_id, // Compatibility
                user_id: r.from_user_id,
                friend_id: r.to_user_id,
                status: r.status,
                friend_details: otherUser || { user_id: otherUserId, user_name: 'Unknown', email: '' }
            };
        });
    }
    static async removeFriend(relationshipId: string): Promise<void> {
        const { error } = await supabase
            .from('friend_requests') // We look at the friend list table to find the connection to remove.
            .delete()
            .eq('request_id', relationshipId); // We match the exact ID to ensure we remove the correct friend.

        if (error) throw new Error(error.message);
    }

    static async rejectFriend(relationshipId: string): Promise<void> {
        const { error } = await supabase
            .from('friend_requests')
            .update({ status: 'rejected' })
            .eq('request_id', relationshipId);

        if (error) throw new Error(error.message);
    }
}
