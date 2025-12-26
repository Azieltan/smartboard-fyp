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
    status?: 'active' | 'pending';
    joined_at: string;
    can_manage_members?: boolean;
    // Joined user details
    user_name?: string;
    email?: string;
}

export class GroupService {
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
            .maybeSingle();

        if (findError) console.error(`[GroupService] Find DM error:`, findError);

        if (existingGroup) {
            console.log(`[GroupService] Found existing DM group: ${existingGroup.group_id}`);
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
                status: 'active',
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
                            'Added to Group',
                            `You have been added to the group "${name}"`,
                            { groupId: groupData.group_id }
                        );
                    } catch (e) {
                        console.error('Failed to notify friend', e);
                    }
                });
            }
        }

        return groupData as Group;
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
        return (data || [])
            .filter((item: any) => !item.groups.is_dm)
            .map((item: any) => ({
                ...item.groups,
                role: item.role,
                can_manage_members: item.can_manage_members
            }));
    }

    // ==================== Member Management ====================
    static async addMember(
        groupId: string,
        userId: string,
        role: 'owner' | 'admin' | 'member' = 'member',
        status: 'active' | 'pending' = 'active',
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

                await NotificationService.createNotification(
                    userId,
                    'group_invite',
                    status === 'pending' ? 'Group Invitation' : 'Added to Group',
                    status === 'pending' ? `You have been invited to join "${groupName}"` : `You have been added to "${groupName}"`,
                    { groupId }
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
        const canRemove =
            requester.role === 'owner' ||
            (requester.role === 'admin' && requester.can_manage_members);

        if (!canRemove) {
            throw new Error('You do not have permission to remove members');
        }

        // Cannot remove the owner
        const target = await this.getMemberRole(groupId, targetUserId);
        if (target?.role === 'owner') {
            throw new Error('Cannot remove the group owner');
        }

        // Admin cannot remove other admins (only owner can)
        if (requester.role === 'admin' && target?.role === 'admin') {
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
                            'New Join Request',
                            `${joinerName} has requested to join "${group.name}".`,
                            { groupId: group.group_id, joinerId: userId }
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
        const { data, error } = await supabase
            .from('group_members')
            .select('*, users!inner(user_name, email)')
            .eq('group_id', groupId)
            .eq('status', 'pending');

        if (error) throw new Error(error.message);
        return data;
    }

    static async updateMemberStatus(groupId: string, userId: string, status: 'active' | 'rejected'): Promise<void> {
        if (status === 'rejected') {
            const { error } = await supabase
                .from('group_members')
                .delete()
                .eq('group_id', groupId)
                .eq('user_id', userId);
            if (error) throw new Error(error.message);
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
                    'Request Approved',
                    `Your request to join "${groupName}" has been approved!`,
                    { groupId }
                );
            } catch (e) {
                console.error('Failed to notify approved member', e);
            }
        }
    }
}
