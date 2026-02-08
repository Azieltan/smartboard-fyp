import { supabase } from '../lib/supabase';
import { NotificationService } from './notification';

export interface Group {
    group_id: string;
    name: string;
    user_id: string; // DB owner (creator)
    created_at: string;
    join_code?: string;
    requires_approval?: boolean;
    is_dm?: boolean;
}

export interface GroupMember {
    group_id: string;
    user_id: string;
    role: 'owner' | 'admin' | 'member';
    status?: 'active' | 'pending' | 'invited';
    joined_at: string;
    can_manage_members?: boolean;
    // Joined user details
    user_name?: string;
    email?: string;
    // Group details when joining from member perspective
    groups?: {
        name: string;
        is_dm: boolean;
    };
}

export class GroupService {
    // ... (previous methods)

    static async getUserInvitations(userId: string): Promise<GroupMember[]> {
        console.log(`[GroupService] Fetching invitations for user ${userId}`);
        const { data, error } = await supabase
            .from('group_members')
            .select('group_id, role, status, joined_at, groups(name, is_dm)')
            .eq('user_id', userId)
            .eq('status', 'invited');

        if (error) {
            console.error('[GroupService] Error fetching invitations:', error);
            throw new Error(error.message);
        }

        return (data || []).map((m: any) => ({
            ...m,
            groups: m.groups // Supabase returns single object for joining on foreign key
        })) as GroupMember[];
    }

    static async acceptInvitation(groupId: string, userId: string): Promise<void> {
        const { error } = await supabase
            .from('group_members')
            .update({ status: 'active' })
            .eq('group_id', groupId)
            .eq('user_id', userId)
            .eq('status', 'invited');

        if (error) throw new Error(error.message);

        // Notify owner that user accepted? Optional.
    }

    static async declineInvitation(groupId: string, userId: string): Promise<void> {
        const { error } = await supabase
            .from('group_members')
            .delete()
            .eq('group_id', groupId)
            .eq('user_id', userId)
            .eq('status', 'invited');

        if (error) throw new Error(error.message);
    }
    // ... (rest of methods)

    static async inviteUser(groupId: string, targetUserId: string, requesterId: string): Promise<void> {
        // 1. Check requester permissions
        const requester = await this.getMemberRole(groupId, requesterId);
        const canInvite = requester?.role === 'owner' || requester?.role === 'admin' || requester?.can_manage_members;

        if (!canInvite) {
            throw new Error('You do not have permission to invite members');
        }

        // 2. Check if target exists
        const { data: targetUser } = await supabase.from('users').select('user_id').eq('user_id', targetUserId).single();
        if (!targetUser) {
            throw new Error('User not found');
        }

        // 3. Check if already member
        const existing = await this.getMemberRole(groupId, targetUserId);
        if (existing) {
            if (existing.status === 'active') throw new Error('User is already a member of this group');
            if (existing.status === 'invited') throw new Error('User has already been invited');
            if (existing.status === 'pending') throw new Error('User has already requested to join');
        }

        // 4. Add member as invited
        await this.addMember(groupId, targetUserId, 'member', 'invited');
    }
    // ==================== DM Functions ====================
    static async getOrCreateDirectChat(user1Id: string, user2Id: string): Promise<string> {
        console.log(`[GroupService] getOrCreateDirectChat: ${user1Id} <-> ${user2Id}`);
        const userIds = [user1Id, user2Id].sort();
        const dmGroupName = `dm-${userIds[0]}-${userIds[1]}`;
        console.log(`[GroupService] DM group name: ${dmGroupName}`);

        const { data: existingGroup, error: findError } = await supabase
            .from('groups')
            .select('group_id')
            .eq('name', dmGroupName)
            .eq('is_dm', true)
            .limit(1)
            .maybeSingle();

        if (findError) console.error(`[GroupService] Find DM error:`, findError);

        if (existingGroup) {
            console.log(`[GroupService] Found existing DM group: ${existingGroup.group_id}`);
            // Ensure members exist (in case of data issues)
            try {
                await Promise.all([
                    this.addMember(existingGroup.group_id, user1Id, 'member', 'active'),
                    this.addMember(existingGroup.group_id, user2Id, 'member', 'active')
                ]);
            } catch (memberErr) {
                // Ignore errors (likely already members)
            }
            return existingGroup.group_id;
        }

        console.log(`[GroupService] Creating new DM group...`);
        const { data: newGroup, error } = await supabase
            .from('groups')
            .insert([{
                name: dmGroupName,
                user_id: user1Id,
                requires_approval: false,
                is_dm: true
            }])
            .select()
            .single();

        if (error) {
            console.error(`[GroupService] Create DM error:`, error);
            throw new Error(error.message);
        }
        console.log(`[GroupService] Created group: ${newGroup.group_id}`);

        try {
            await Promise.all([
                this.addMember(newGroup.group_id, user1Id, 'member', 'active'),
                this.addMember(newGroup.group_id, user2Id, 'member', 'active')
            ]);
        } catch (memberErr) {
            console.error("Error adding DM members:", memberErr);
        }

        return newGroup.group_id;
    }

    // ==================== Group CRUD ====================
    static async createGroup(
        name: string,
        ownerId: string,
        requiresApproval: boolean = false,
        friendIds: string[] = [],
        friendRoles: Record<string, 'admin' | 'member'> = {}
    ): Promise<Group> {
        // Generate a random 6-character code
        const joinCode = Math.random().toString(36).substring(2, 8).toUpperCase();

        const { data: groupData, error: groupError } = await supabase
            .from('groups')
            .insert([{ name, user_id: ownerId, join_code: joinCode, requires_approval: requiresApproval, is_dm: false }])
            .select()
            .single();

        if (groupError) {
            throw new Error(groupError.message);
        }

        // Add creator as OWNER (not admin)
        await this.addMember(groupData.group_id, ownerId, 'owner', 'active');

        // Add friends if provided with their assigned roles
        if (friendIds.length > 0) {
            const members = friendIds.map(friendId => ({
                group_id: groupData.group_id,
                user_id: friendId,
                role: friendRoles[friendId] || 'member',
                status: 'invited',
                can_manage_members: false
            }));


            const { error: friendsError } = await supabase
                .from('group_members')
                .insert(members);

            if (friendsError) {
                console.error("Error adding friends:", friendsError);
            } else {
                // Notify friends
                members.forEach(async (member) => {
                    try {
                        await NotificationService.createNotification(
                            member.user_id,
                            'group_invite',
                            {
                                title: 'Group Invitation',
                                message: `You have been invited to join the group "${name}"`,
                                groupId: groupData.group_id
                            }
                        );
                    } catch (e) {
                        console.error('Failed to notify friend', e);
                    }
                });
            }
        }

        return groupData as Group;
    }

    static async updateGroup(groupId: string, updates: { name?: string; description?: string; requires_approval?: boolean; requesterId: string }): Promise<Group> {
        // Only owner can update group
        const requester = await this.getMemberRole(groupId, updates.requesterId);

        // Fetch group to check owner_id directly if member role check is ambiguous
        const { data: group } = await supabase.from('groups').select('user_id').eq('group_id', groupId).single();
        const isOwnerDirect = group?.user_id === updates.requesterId;

        if (!isOwnerDirect && (!requester || requester.role !== 'owner')) {
            throw new Error('Only the owner can update group settings');
        }

        const toUpdate: any = {};
        if (updates.name !== undefined) toUpdate.name = updates.name;
        if (updates.description !== undefined) toUpdate.description = updates.description;
        if (updates.requires_approval !== undefined) toUpdate.requires_approval = updates.requires_approval;

        const { data, error } = await supabase
            .from('groups')
            .update(toUpdate)
            .eq('group_id', groupId)
            .select()
            .single();

        if (error) throw new Error(error.message);
        return data as Group;
    }

    static async getGroup(groupId: string): Promise<Group> {
        const { data, error } = await supabase
            .from('groups')
            .select('*')
            .eq('group_id', groupId)
            .single();

        if (error) {
            throw new Error(error.message);
        }

        return data as Group;
    }

    static async getUserGroups(userId: string): Promise<any[]> {
        const { data, error } = await supabase
            .from('group_members')
            .select('role, can_manage_members, groups!inner(*)')
            .eq('user_id', userId)
            .eq('status', 'active');

        if (error) {
            throw new Error(error.message);
        }

        // Filter out DMs and map
        const groups = (data || []).filter((item: any) => !item.groups.is_dm);

        if (groups.length === 0) {
            return [];
        }

        // Fetch last message for each group
        const groupIds = groups.map((g: any) => g.groups.group_id);

        // We need to associate messages with groups. 
        // Best way is to find chats for these groups, then messages.
        // Or simpler: query messages joined with chats where group_id is in list.
        // Due to Supabase limitation on deep nesting/aggregates in one go, we might loop or use RPC.
        // For now, let's fetch chats for these groups.

        const { data: chats } = await supabase
            .from('chats')
            .select('chat_id, group_id')
            .in('group_id', groupIds);

        const chatIdMap = new Map<string, string>();
        chats?.forEach((c: any) => chatIdMap.set(c.group_id, c.chat_id));

        // Fetch latest messages for these chats
        // This is N+1 but limited by user group count (usually small). 
        // Optimized approach would use a Postgres function.

        const results = await Promise.all(groups.map(async (item: any) => {
            const groupId = item.groups.group_id;
            const chatId = chatIdMap.get(groupId);
            let lastMessage = null;
            let unreadCount = 0;

            if (chatId) {
                // Get latest message
                const { data: msgs } = await supabase
                    .from('messages')
                    .select('content, send_time')
                    .eq('chat_id', chatId)
                    .order('send_time', { ascending: false })
                    .limit(1);

                if (msgs && msgs.length > 0) {
                    lastMessage = msgs[0];
                }

                // Get unread count (mock: messages in last 24h not by me? or just total count?)
                // Since we don't have last_read_at, we'll return 0 or a placeholder.
                // User asked for "number... after seen number will disappear".
                // We need `last_read_at` on group_members.
                // Let's assume we can fetch it if it existed.
                // For now, we will return 0 to avoid showing wrong numbers, or we can use a local storage hack on frontend.
                // Let's try to fetch actual count of messages today as a proxy for activity if we can't track read.
                // BETTER: We can just return the total count of messages, and frontend calculates diff from local storage.

                const { count } = await supabase
                    .from('messages')
                    .select('*', { count: 'exact', head: true })
                    .eq('chat_id', chatId);

                unreadCount = count || 0;
            }

            return {
                ...item.groups,
                role: item.role,
                can_manage_members: item.can_manage_members,
                last_message: lastMessage,
                total_messages: unreadCount // Passing total count to let frontend diff it
            };
        }));

        return results.sort((a, b) => {
            const timeA = new Date(a.last_message?.send_time || a.created_at).getTime();
            const timeB = new Date(b.last_message?.send_time || b.created_at).getTime();
            return timeB - timeA;
        });
    }

    // ==================== Member Management ====================
    static async addMember(
        groupId: string,
        userId: string,
        role: 'owner' | 'admin' | 'member' = 'member',
        status: 'active' | 'pending' | 'invited' = 'active',
        canManageMembers: boolean = false
    ): Promise<GroupMember> {
        const { data, error } = await supabase
            .from('group_members')
            .insert([{
                group_id: groupId,
                user_id: userId,
                role,
                status,
                can_manage_members: role === 'owner' ? true : canManageMembers
            }])
            .select()
            .single();

        if (error) {
            // If already exists, return existing
            if (error.code === '23505') {
                const { data: existing } = await supabase
                    .from('group_members')
                    .select('*')
                    .eq('group_id', groupId)
                    .eq('user_id', userId)
                    .single();
                return existing as GroupMember;
            }
            throw new Error(error.message);
        }

        if (role !== 'owner') {
            try {
                // Fetch group name
                const { data: group } = await supabase.from('groups').select('name').eq('group_id', groupId).single();
                const groupName = group?.name || 'a group';

                let title = 'Added to Group';
                let message = `You have been added to "${groupName}"`;

                if (status === 'invited') {
                    title = 'Group Invitation';
                    message = `You have been invited to join "${groupName}"`;
                } else if (status === 'pending') {
                    title = 'Waitlisted';
                    message = `You are on the waitlist for "${groupName}"`;
                }

                await NotificationService.createNotification(
                    userId,
                    'group_invite',
                    {
                        title,
                        message,
                        groupId
                    }
                );
            } catch (e) {
                console.error('Failed to notify member', e);
            }
        }

        return data as GroupMember;
    }

    static async getGroupMembers(groupId: string): Promise<GroupMember[]> {
        const { data, error } = await supabase
            .from('group_members')
            .select('*, users!inner(user_name, email)')
            .eq('group_id', groupId)
            .eq('status', 'active')
            .order('role', { ascending: true }); // owner first, then admin, then member

        if (error) throw new Error(error.message);

        return (data || []).map((m: any) => ({
            group_id: m.group_id,
            user_id: m.user_id,
            role: m.role,
            status: m.status,
            joined_at: m.joined_at,
            can_manage_members: m.can_manage_members,
            user_name: m.users?.user_name,
            email: m.users?.email
        }));
    }

    static async getMemberRole(groupId: string, userId: string): Promise<GroupMember | null> {
        const { data, error } = await supabase
            .from('group_members')
            .select('*')
            .eq('group_id', groupId)
            .eq('user_id', userId)
            .maybeSingle();

        if (error) throw new Error(error.message);
        return data as GroupMember | null;
    }

    static async removeMember(groupId: string, targetUserId: string, requesterId: string): Promise<void> {
        // Get requester's role
        const requester = await this.getMemberRole(groupId, requesterId);
        if (!requester) throw new Error('You are not a member of this group');

        // Check permissions
        // Admins can remove members if they have permission, OR if we hardcode admins can remove members
        // Plan says: "Admin: ... Add/Remove users (but not owner)."
        // So Admins should be able to remove members.
        const canRemove =
            requester.role === 'owner' ||
            requester.role === 'admin';

        if (!canRemove) {
            throw new Error('You do not have permission to remove members');
        }

        // Cannot remove the owner
        const target = await this.getMemberRole(groupId, targetUserId);
        if (!target) throw new Error('Target user is not a member');

        if (target.role === 'owner') {
            throw new Error('Cannot remove the group owner');
        }

        // Admin cannot remove other admins (only owner can)
        if (requester.role === 'admin' && target.role === 'admin') {
            throw new Error('Admins cannot remove other admins');
        }

        const { error } = await supabase
            .from('group_members')
            .delete()
            .eq('group_id', groupId)
            .eq('user_id', targetUserId);

        if (error) throw new Error(error.message);
    }

    static async updateMemberRole(
        groupId: string,
        targetUserId: string,
        newRole: 'admin' | 'member',
        requesterId: string
    ): Promise<void> {
        // Only owner can change roles
        const requester = await this.getMemberRole(groupId, requesterId);
        if (!requester || requester.role !== 'owner') {
            throw new Error('Only the owner can change member roles');
        }

        // Cannot change owner's role
        const target = await this.getMemberRole(groupId, targetUserId);
        if (target?.role === 'owner') {
            throw new Error('Cannot change the owner\'s role');
        }

        const { error } = await supabase
            .from('group_members')
            .update({
                role: newRole,
                // Reset permission when demoting to member
                can_manage_members: newRole === 'member' ? false : target?.can_manage_members
            })
            .eq('group_id', groupId)
            .eq('user_id', targetUserId);

        if (error) throw new Error(error.message);
    }

    static async toggleAdminPermission(
        groupId: string,
        adminUserId: string,
        canManage: boolean,
        ownerId: string
    ): Promise<void> {
        // Verify requester is owner
        const requester = await this.getMemberRole(groupId, ownerId);
        if (!requester || requester.role !== 'owner') {
            throw new Error('Only the owner can modify admin permissions');
        }

        // Verify target is admin
        const target = await this.getMemberRole(groupId, adminUserId);
        if (!target || target.role !== 'admin') {
            throw new Error('Target user is not an admin');
        }

        const { error } = await supabase
            .from('group_members')
            .update({ can_manage_members: canManage })
            .eq('group_id', groupId)
            .eq('user_id', adminUserId);

        if (error) throw new Error(error.message);
    }

    // ==================== Join Group ====================
    static async joinGroupRaw(code: string, userId: string): Promise<any> {
        const { data: group, error: groupError } = await supabase
            .from('groups')
            .select('*')
            .eq('join_code', code)
            .single();

        if (groupError || !group) {
            throw new Error('Invalid Group Code');
        }

        const { data: existing } = await supabase
            .from('group_members')
            .select('*')
            .eq('group_id', group.group_id)
            .eq('user_id', userId)
            .maybeSingle();

        if (existing) {
            if (existing.status === 'pending') {
                throw new Error('Join request is already pending approval');
            }
            throw new Error('Already a member of this group');
        }

        const status = group.requires_approval ? 'pending' : 'active';
        await this.addMember(group.group_id, userId, 'member', status);

        // If pending, notify owner/admins
        if (status === 'pending') {
            try {
                // Fetch group name and joiner name
                const { data: joiner } = await supabase.from('users').select('user_name').eq('user_id', userId).single();
                const joinerName = joiner?.user_name || 'Someone';

                // Fetch owner and admins
                const { data: admins } = await supabase
                    .from('group_members')
                    .select('user_id')
                    .eq('group_id', group.group_id)
                    .in('role', ['owner', 'admin']);

                if (admins) {
                    for (const admin of admins) {
                        await NotificationService.createNotification(
                            admin.user_id,
                            'join_request',
                            {
                                title: 'New Join Request',
                                message: `${joinerName} has requested to join "${group.name}".`,
                                groupId: group.group_id,
                                joinerId: userId
                            }
                        );
                    }
                }
            } catch (notifyError) {
                console.error('Failed to notify admins of join request', notifyError);
            }
        }

        return {
            success: true,
            message: status === 'pending' ? 'Join request sent. Waiting for approval.' : 'Joined group successfully',
            group: group
        };
    }

    static async regenerateJoinCode(groupId: string, requesterId: string): Promise<string> {
        // Only owner can regenerate code
        const requester = await this.getMemberRole(groupId, requesterId);
        if (!requester || requester.role !== 'owner') {
            throw new Error('Only the owner can regenerate the join code');
        }

        const newCode = Math.random().toString(36).substring(2, 8).toUpperCase();

        const { error } = await supabase
            .from('groups')
            .update({ join_code: newCode })
            .eq('group_id', groupId);

        if (error) throw new Error(error.message);

        return newCode;
    }

    // ==================== Pending Members ====================
    static async getPendingMembers(groupId: string): Promise<any[]> {
        console.log(`[GroupService] Fetching pending members for group ${groupId}`);
        const { data, error } = await supabase
            .from('group_members')
            .select('*, users(user_name, email)')
            .eq('group_id', groupId)
            .eq('status', 'pending');

        if (error) {
            console.error('[GroupService] Error fetching pending:', error);
            throw new Error(error.message);
        }

        console.log(`[GroupService] Found ${data?.length || 0} pending members`);
        return data || [];
    }

    static async updateMemberStatus(groupId: string, userId: string, status: 'active' | 'rejected'): Promise<void> {
        if (status === 'rejected') {
            const { error } = await supabase
                .from('group_members')
                .delete()
                .eq('group_id', groupId)
                .eq('user_id', userId);

            if (error) throw new Error(error.message);

            // Notify user of rejection
            try {
                const { data: group } = await supabase.from('groups').select('name').eq('group_id', groupId).single();
                const groupName = group?.name || 'Group';

                await NotificationService.createNotification(
                    userId,
                    'group_approval', // Using same type for simplicity, or create 'group_rejection'
                    {
                        title: 'Join Request Rejected',
                        message: `Your request to join "${groupName}" was declined.`,
                        groupId
                    }
                );
            } catch (e) {
                console.error('Failed to notify rejection', e);
            }
        } else {
            const { error } = await supabase
                .from('group_members')
                .update({ status: 'active' })
                .eq('group_id', groupId)
                .eq('user_id', userId);
            if (error) throw new Error(error.message);

            // Notify user
            try {
                // Fetch group name
                const { data: group } = await supabase.from('groups').select('name').eq('group_id', groupId).single();
                const groupName = group?.name || 'Group';

                await NotificationService.createNotification(
                    userId,
                    'group_approval',
                    {
                        title: 'Request Approved',
                        message: `Your request to join "${groupName}" has been approved!`,
                        groupId
                    }
                );
            } catch (e) {
                console.error('Failed to notify approved member', e);
            }
        }
    }

    static async leaveGroup(groupId: string, userId: string): Promise<void> {
        // 1. Check if member
        const member = await this.getMemberRole(groupId, userId);
        if (!member) {
            throw new Error('You are not a member of this group');
        }

        // 2. Owner cannot leave
        if (member.role === 'owner') {
            throw new Error('The group owner cannot leave the group. You must delete the group instead.');
        }

        // 3. Delete member
        const { error } = await supabase
            .from('group_members')
            .delete()
            .eq('group_id', groupId)
            .eq('user_id', userId);

        if (error) throw new Error(error.message);

        // 4. Notify Owner and Admins
        try {
            // Get user name for message
            const { data: user } = await supabase.from('users').select('user_name').eq('user_id', userId).single();
            const userName = user?.user_name || 'A user';

            // Get group name
            const { data: group } = await supabase.from('groups').select('name').eq('group_id', groupId).single();
            const groupName = group?.name || 'the group';

            const { data: recipients } = await supabase
                .from('group_members')
                .select('user_id')
                .eq('group_id', groupId)
                .in('role', ['owner', 'admin']);

            if (recipients) {
                for (const recipient of recipients) {
                    await NotificationService.createNotification(
                        recipient.user_id,
                        'group_leave',
                        {
                            title: 'Member Left Group',
                            message: `${userName} has left "${groupName}".`,
                            groupId
                        }
                    );
                }
            }
        } catch (e) {
            console.error('Failed to send leave notifications', e);
        }
    }
}
