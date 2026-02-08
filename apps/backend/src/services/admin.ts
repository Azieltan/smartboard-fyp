import { supabase } from '../lib/supabase';
import { Task } from '@smartboard/home';
import { CalendarEvent } from './calendar';

export class AdminService {
    static async getAllUsers() {
        // 1. Get public profile data
        const { data: profiles, error: profileError } = await supabase
            .from('users')
            .select('*')
            .order('created_at', { ascending: false });

        if (profileError) throw new Error(profileError.message);

        // 2. Get auth data to check 'banned_until'
        const { data: { users: authUsers }, error: authError } = await supabase.auth.admin.listUsers();

        if (authError) throw new Error(authError.message);

        // 3. Merge
        const authMap = new Map(authUsers.map(u => [u.id, u]));

        return profiles.map(p => {
            const authUser = authMap.get(p.user_id);
            const isBanned = (authUser as any)?.banned_until && new Date((authUser as any).banned_until) > new Date();
            return {
                ...p,
                is_active: !isBanned
            };
        });
    }

    static async toggleUserStatus(userId: string, isActive: boolean) {
        if (isActive) {
            // Activate (Unban)
            const { error } = await supabase.auth.admin.updateUserById(userId, {
                ban_duration: 'none'
            });
            if (error) throw new Error(error.message);
        } else {
            // Deactivate (Ban)
            const { error } = await supabase.auth.admin.updateUserById(userId, {
                ban_duration: '876600h' // ~100 years
            });
            if (error) throw new Error(error.message);
        }
        return true;
    }

    static async getUserStats() {
        // Get total users
        const { count: userCount, error: userError } = await supabase
            .from('users')
            .select('*', { count: 'exact', head: true });

        if (userError) throw new Error(userError.message);

        // Get total tasks
        const { count: taskCount, error: taskError } = await supabase
            .from('tasks')
            .select('*', { count: 'exact', head: true });

        if (taskError) throw new Error(taskError.message);

        // Get active tasks (todo/in_progress)
        const { count: activeTaskCount, error: activeTaskError } = await supabase
            .from('tasks')
            .select('*', { count: 'exact', head: true })
            .in('status', ['todo', 'in_progress']);

        if (activeTaskError) throw new Error(activeTaskError.message);

        // Get completed tasks
        const { count: completedTaskCount, error: completedTaskError } = await supabase
            .from('tasks')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'done');

        if (completedTaskError) throw new Error(completedTaskError.message);

        return {
            totalUsers: userCount || 0,
            totalTasks: taskCount || 0,
            activeTasks: activeTaskCount || 0,
            completedTasks: completedTaskCount || 0
        };
    }

    static async deleteUser(userId: string) {
        // 1. Delete from Supabase Auth
        const { error: authError } = await supabase.auth.admin.deleteUser(userId);
        if (authError) console.error("Failed to delete auth user:", authError);

        // 2. Delete user from DB
        const { error } = await supabase
            .from('users')
            .delete()
            .eq('user_id', userId);

        if (error) throw new Error(error.message);

        return true;
    }

    static async exportData() {
        const users = await this.getAllUsers();
        // Since we can't easily join count in the merged fetch, we might need a separate query or rough logic.
        // For admin export, simple is better. Let's re-fetch tasks count if needed or just dump profiles.
        // The user asked for "Report that can export to excel", likely just users list.
        // Re-implementing with task count joined locally.

        const { data: tasks } = await supabase.from('tasks').select('user_id');
        const taskCounts = new Map();
        tasks?.forEach((t: any) => {
            taskCounts.set(t.user_id, (taskCounts.get(t.user_id) || 0) + 1);
        });

        return users.map((u: any) => ({
            ID: u.user_id,
            Name: u.user_name,
            Email: u.email,
            Role: u.role,
            Status: u.is_active ? 'Active' : 'Deactivated',
            JoinedAt: u.created_at,
            TaskCount: taskCounts.get(u.user_id) || 0
        }));
    }

    // --- Task Management ---

    static async getAllTasks() {
        // Fetch all tasks with extra details
        const { data, error } = await supabase
            .from('tasks')
            .select(`
                *,
                owner:users!tasks_created_by_fkey(user_name),
                assignee:users!tasks_assignee_id_fkey(user_name),
                group:groups(name)
            `)
            .order('created_at', { ascending: false });

        if (error) throw new Error(error.message);
        return data;
    }

    static async updateTask(taskId: string, updates: Partial<Task>) {
        const { data, error } = await supabase
            .from('tasks')
            .update(updates)
            .eq('task_id', taskId)
            .select()
            .single();

        if (error) throw new Error(error.message);
        return data;
    }

    static async deleteTask(taskId: string) {
        const { error } = await supabase
            .from('tasks')
            .delete()
            .eq('task_id', taskId);

        if (error) throw new Error(error.message);
        return true;
    }

    // --- Event Management ---

    static async getAllEvents() {
        const { data, error } = await supabase
            .from('calendar_events')
            .select(`
                *,
                creator:users!calendar_events_user_id_fkey(user_name)
            `)
            .order('start_time', { ascending: false });

        if (error) throw new Error(error.message);
        return data;
    }

    static async updateEvent(eventId: string, updates: Partial<CalendarEvent>) {
        const { data, error } = await supabase
            .from('calendar_events')
            .update(updates)
            .eq('event_id', eventId)
            .select()
            .single();

        if (error) throw new Error(error.message);
        return data;
    }

    static async deleteEvent(eventId: string) {
        const { error } = await supabase
            .from('calendar_events')
            .delete()
            .eq('event_id', eventId);

        if (error) throw new Error(error.message);
        return true;
    }

    // --- User Management ---
    static async createUser(payload: { email: string; password?: string; name: string; role: string }) {
        console.log('[AdminService] Creating user with payload:', { ...payload, password: '***' });
        const { email, password, name, role } = payload;
        const finalPassword = password || Math.random().toString(36).slice(-8) + 'Aa1!';

        // 1. Create auth user (auto confirmed)
        console.log('[AdminService] Calling supabase.auth.admin.createUser...');
        const { data: { user: authUser }, error: authError } = await supabase.auth.admin.createUser({
            email,
            password: finalPassword,
            email_confirm: true,
            user_metadata: { display_name: name }
        });
        console.log('[AdminService] Auth user creation result:', authUser ? 'SUCCESS' : 'FAILURE', authError?.message || '');

        if (authError) throw new Error(authError.message);
        if (!authUser) throw new Error('Failed to create auth user');

        // 2. Create profile
        console.log('[AdminService] Creating profile in DB for user_id:', authUser.id);
        const { data: user, error: dbError } = await supabase
            .from('users')
            .upsert({
                user_id: authUser.id,
                user_name: name,
                email: email,
                role: role || 'member',
                password_hash: 'managed_by_supabase'
            })
            .select()
            .single();

        console.log('[AdminService] DB profile creation result:', user ? 'SUCCESS' : 'FAILURE', dbError?.message || '');

        if (dbError) {
            // Cleanup auth user to prevent orphan
            console.warn('[AdminService] DB Error, cleaning up auth user:', authUser.id, dbError.message);
            await supabase.auth.admin.deleteUser(authUser.id);
            throw new Error(dbError.message);
        }

        return { user, password: finalPassword };
    }
}
