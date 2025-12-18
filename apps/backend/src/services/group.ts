import { supabase } from '../lib/supabase';

export interface Group {
    group_id: string;
    name: string;
    user_id: string; // Owner
    created_at: string;
}

export interface GroupMember {
    group_id: string;
    user_id: string;
    role: 'owner' | 'admin' | 'member';
    joined_at: string;
}

export class GroupService {
    static async createGroup(name: string, ownerId: string, requiresApproval: boolean = false, friendIds: string[] = []): Promise<Group> {
        // Generate a random 6-character code
        const joinCode = Math.random().toString(36).substring(2, 8).toUpperCase();

        const { data: groupData, error: groupError } = await supabase
            .from('groups')
            .insert([{ name, user_id: ownerId, join_code: joinCode, requires_approval: requiresApproval }])
            .select()
            .single();

        if (groupError) {
            throw new Error(groupError.message);
        }

        // Add owner as a member (always active)
        await this.addMember(groupData.group_id, ownerId, 'owner', 'active');

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

    static async addMember(groupId: string, userId: string, role: 'owner' | 'admin' | 'member' = 'member', status: 'active' | 'pending' = 'active'): Promise<GroupMember> {
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

        // Check if already a member
        const { data: existing } = await supabase
            .from('group_members')
            .select('*')
            .eq('group_id', group.group_id)
            .eq('user_id', userId)
            .single();

        if (existing) {
            throw new Error('Already a member of this group');
        }

        const status = group.requires_approval ? 'pending' : 'active';

        return await this.addMember(group.group_id, userId, 'member', status);
    }

    static async getUserGroups(userId: string): Promise<Group[]> {
        const { data, error } = await supabase
            .from('group_members')
            .select('group_id, status, groups(*)')
            .eq('user_id', userId)
            .eq('status', 'active'); // Only show active groups? Or show pending too? 

        if (error) {
            throw new Error(error.message);
        }

        // Flatten the result to return just the group details
        return data.map((item: any) => item.groups) as Group[];
    }
}
