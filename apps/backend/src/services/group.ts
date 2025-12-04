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
    static async createGroup(name: string, ownerId: string): Promise<Group> {
        const { data: groupData, error: groupError } = await supabase
            .from('groups')
            .insert([{ name, user_id: ownerId }])
            .select()
            .single();

        if (groupError) {
            throw new Error(groupError.message);
        }

        // Add owner as a member
        await this.addMember(groupData.group_id, ownerId, 'owner');

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

    static async addMember(groupId: string, userId: string, role: 'owner' | 'admin' | 'member' = 'member'): Promise<GroupMember> {
        const { data, error } = await supabase
            .from('group_members')
            .insert([{ group_id: groupId, user_id: userId, role }])
            .select()
            .single();

        if (error) {
            throw new Error(error.message);
        }

        return data as GroupMember;
    }

    static async getUserGroups(userId: string): Promise<Group[]> {
        const { data, error } = await supabase
            .from('group_members')
            .select('group_id, groups(*)')
            .eq('user_id', userId);

        if (error) {
            throw new Error(error.message);
        }

        // Flatten the result to return just the group details
        return data.map((item: any) => item.groups) as Group[];
    }
}
