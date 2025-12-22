import { supabase } from '../lib/supabase';

export interface Group {
    group_id: string;
    name: string;
    owner_id: string; // DB owner
    created_at: string;
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
        // 1. Try to find existing DM group
        // We look for a group where ONLY these 2 users are members and type is 'dm' (we'll use a naming convention or metadata if schema is rigid)
        // For now, let's use a naming convention for the hidden group: "dm-{sorted_ids}"
        const userIds = [user1Id, user2Id].sort();
        const dmGroupName = `dm-${userIds[0]}-${userIds[1]}`;

        const { data: existingGroup } = await supabase
            .from('groups')
            .select('group_id')
            .eq('name', dmGroupName)
            .single();

        if (existingGroup) {
            return existingGroup.group_id;
        }

        // 2. Create new DM group
        const { data: newGroup, error } = await supabase
            .from('groups')
            .insert([{
                name: dmGroupName,
                owner_id: user1Id, // One user technically owns it, doesn't matter much for DM
                requires_approval: false,
                is_dm: true // Ideally we add this column. If not, we rely on name.
            }])
            .select()
            .single();

        if (error) throw new Error(error.message);

        // 3. Add both members
        await Promise.all([
            this.addMember(newGroup.group_id, user1Id, 'member', 'active'),
            this.addMember(newGroup.group_id, user2Id, 'member', 'active')
        ]);

        return newGroup.group_id;
    }

    static async createGroup(name: string, ownerId: string, requiresApproval: boolean = false, friendIds: string[] = []): Promise<Group> {
        // Generate a random 6-character code
        const joinCode = Math.random().toString(36).substring(2, 8).toUpperCase();

        const { data: groupData, error: groupError } = await supabase
            .from('groups')
            .insert([{ name, owner_id: ownerId, join_code: joinCode, requires_approval: requiresApproval }])
            .select()
            .single();

        if (groupError) {
            throw new Error(groupError.message);
        }

        // Add owner as a member (schema only has admin/member)
        await this.addMember(groupData.group_id, ownerId, 'admin', 'active');

        // Add friends if provided
        if (friendIds.length > 0) {
            const members = friendIds.map(friendId => ({
                group_id: groupData.group_id,
                user_id: friendId,
                role: 'member',
                status: 'active' // Direct add assumes active, or could be pending if preferred
            }));

            // Need to handle one by one or bulk? addMember is single.
            // Let's use bulk insert for friends
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
            .single();

        if (existing) {
            if (existing.status === 'pending') {
                throw new Error('Join request is already pending approval');
            }
            throw new Error('Already a member of this group');
        }

        const status = group.requires_approval ? 'pending' : 'active';

        await this.addMember(group.group_id, userId, 'member', status); // Use implicit 'member' role

        return {
            success: true,
            message: status === 'pending' ? 'Join request sent. Waiting for approval.' : 'Joined group successfully',
            group: {
                ...group,
                // Frontend expects owner under user_id
                user_id: group.owner_id
            }
        };
    }

    static async getUserGroups(userId: string): Promise<any[]> {
        const { data, error } = await supabase
            .from('group_members')
            .select('role, groups!inner(*)')
            .eq('user_id', userId)
            .eq('status', 'active')
            // Filter out DMs from the main group list
            .or('is_dm.is.null,is_dm.eq.false', { foreignTable: 'groups' });

        if (error) {
            throw new Error(error.message);
        }

        // Flatten the result to return group details with the user's role
        return data.map((item: any) => ({
            ...item.groups,
            // Frontend expects owner under user_id
            user_id: item.groups.owner_id,
            role: item.role
        }));
    }
}
