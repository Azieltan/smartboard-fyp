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

        // Fetch DM groups for accepted friends to get last message
        // We can find DM groups by name pattern 'dm-id-id' (sorted) or by querying groups where these users are members.
        // Let's use the 'dm-A-B' convention for lookup as it's efficient if we know IDs.

        const friendsWithDmInfo = await Promise.all(requests.map(async (r: any) => {
            const isSender = r.from_user_id === userId;
            const otherUserId = isSender ? r.to_user_id : r.from_user_id;
            const otherUser = userMap.get(otherUserId);

            let lastMessage = null;
            let unreadCount = 0;
            let dmGroupId = null;

            if (r.status === 'accepted') {
                // Try to find the DM group
                const userIds = [userId, otherUserId].sort();
                const dmGroupName = `dm-${userIds[0]}-${userIds[1]}`;

                // Get group ID
                const { data: dmGroup } = await supabase
                    .from('groups')
                    .select('group_id')
                    .eq('name', dmGroupName)
                    .eq('is_dm', true)
                    .maybeSingle();

                if (dmGroup) {
                    dmGroupId = dmGroup.group_id;

                    // Get chat ID
                    const { data: chat } = await supabase
                        .from('chats')
                        .select('chat_id')
                        .eq('group_id', dmGroup.group_id)
                        .maybeSingle();

                    if (chat) {
                        // Get last message
                        const { data: msgs } = await supabase
                            .from('messages')
                            .select('content, send_time')
                            .eq('chat_id', chat.chat_id)
                            .order('send_time', { ascending: false })
                            .limit(1);

                        if (msgs && msgs.length > 0) {
                            lastMessage = msgs[0];
                        }

                        // Get total count (for badge calc)
                        const { count } = await supabase
                            .from('messages')
                            .select('*', { count: 'exact', head: true })
                            .eq('chat_id', chat.chat_id);

                        unreadCount = count || 0;
                    }
                }
            }

            return {
                id: r.request_id,
                relationship_id: r.request_id, // Compatibility
                user_id: r.from_user_id,
                friend_id: r.to_user_id,
                status: r.status,
                friend_details: otherUser || { user_id: otherUserId, user_name: 'Unknown', email: '' },
                last_message: lastMessage,
                total_messages: unreadCount,
                dm_group_id: dmGroupId
            };
        }));

        return friendsWithDmInfo;
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
