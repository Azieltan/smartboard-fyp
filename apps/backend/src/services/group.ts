import { supabase } from '../lib/supabase';

export interface Group {
    group_id: string;
    name: string;
    user_id: string; // DB owner
    created_at: string;
    join_code?: string;
    requires_approval?: boolean;
    is_dm?: boolean;
}

export interface GroupMember {
    group_id: string;
    user_id: string;
    role: 'admin' | 'member';
    status?: 'active' | 'pending';
    joined_at: string;
}

export class GroupService {
    static async getOrCreateDirectChat(user1Id: string, user2Id: string): Promise<string> {
        console.log(`[GroupService] getOrCreateDirectChat: ${user1Id} <-> ${user2Id}`);
        // 1. Try to find existing DM group
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

        // 2. Create new DM group
        console.log(`[GroupService] Creating new DM group...`);
        const { data: newGroup, error } = await supabase
            .from('groups')
            .insert([{
                name: dmGroupName,
                user_id: user1Id, // One user technically owns it
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

        // 3. Add both members
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

    static async createGroup(name: string, ownerId: string, requiresApproval: boolean = false, friendIds: string[] = []): Promise<Group> {
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

        // Add owner as a member
        await this.addMember(groupData.group_id, ownerId, 'admin', 'active');

        // Add friends if provided
        if (friendIds.length > 0) {
            const members = friendIds.map(friendId => ({
                group_id: groupData.group_id,
                user_id: friendId,
                role: 'member',
                status: 'active'
            }));

            const { error: friendsError } = await supabase
                .from('group_members')
                .insert(members);

            if (friendsError) console.error("Error adding friends:", friendsError);
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

    static async addMember(groupId: string, userId: string, role: 'admin' | 'member' = 'member', status: 'active' | 'pending' = 'active'): Promise<GroupMember> {
        const { data, error } = await supabase
            .from('group_members')
            .insert([{ group_id: groupId, user_id: userId, role, status }])
            .select()
            .single();

        if (error) {
            // If already exists, just return existing
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

        return data as GroupMember;
    }

    static async joinGroupRaw(code: string, userId: string): Promise<any> {
        // Find group by code
        const { data: group, error: groupError } = await supabase
            .from('groups')
            .select('*')
            .eq('join_code', code)
            .single();

        if (groupError || !group) {
            throw new Error('Invalid Group Code');
        }

        // Check if already a member or pending
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

        return {
            success: true,
            message: status === 'pending' ? 'Join request sent. Waiting for approval.' : 'Joined group successfully',
            group: group
        };
    }

    static async getUserGroups(userId: string): Promise<any[]> {
        const { data, error } = await supabase
            .from('group_members')
            .select('role, groups!inner(*)')
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
                role: item.role
            }));
    }

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
        }
    }
}
