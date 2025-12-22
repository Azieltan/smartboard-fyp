import { supabase } from '../lib/supabase';
import { Task } from '@smartboard/home';

export class TaskService {
    static async getAllTasks(userId?: string): Promise<Task[]> {
        let query = supabase.from('tasks').select('*');

        if (userId) {
            query = query.eq('owner_id', userId);
        }

        const { data, error } = await query;

        if (error) {
            throw new Error(error.message);
        }

        // Map DB shape -> frontend expected shape
        return (data || []).map((t: any) => ({
            ...t,
            user_id: t.owner_id
        })) as Task[];
    }

    static async createTask(task: Partial<Task>): Promise<Task> {
        // Accept frontend payloads that use user_id; DB uses owner_id
        const insertPayload: any = { ...task };
        if (!insertPayload.owner_id && insertPayload.user_id) insertPayload.owner_id = insertPayload.user_id;
        delete insertPayload.user_id;
        // Strip fields that don't exist in Supabase Auth schema
        delete insertPayload.created_by;
        delete insertPayload.edited_by;

        const { data, error } = await supabase
            .from('tasks')
            .insert([insertPayload])
            .select()
            .single();

        if (error) {
            throw new Error(error.message);
        }

        // Notification Logic
        if (insertPayload.group_id) {
            try {
                // Import dynamically to avoid circular dependency issues if any
                const { ChatService } = require('./chat');
                const chat = await ChatService.getChatByGroupId(insertPayload.group_id);
                if (chat) {
                    const messageContent = `📋 New Task Assigned: **${insertPayload.title}**\nDue: ${insertPayload.due_date ? new Date(insertPayload.due_date).toLocaleDateString() : 'No Date'}`;
                    // Use owner_id as sender when we don't have created_by
                    await ChatService.sendMessage(chat.chat_id, insertPayload.owner_id || 'system', messageContent);
                }
            } catch (notifyError) {
                console.error('Failed to send task notification:', notifyError);
                // Don't fail the task creation just because notification failed
            }
        }

        return ({ ...data, user_id: (data as any).owner_id } as any) as Task;
    }
    static async updateTask(taskId: string, updates: Partial<Task>): Promise<Task> {
        // Accept frontend payload user_id; DB uses owner_id
        const updatePayload: any = { ...updates };
        if (!updatePayload.owner_id && updatePayload.user_id) updatePayload.owner_id = updatePayload.user_id;
        delete updatePayload.user_id;
        delete updatePayload.created_by;
        delete updatePayload.edited_by;

        const { data, error } = await supabase
            .from('tasks')
            .update(updatePayload)
            .eq('task_id', taskId)
            .select()
            .single();

        if (error) {
            throw new Error(error.message);
        }

        return ({ ...data, user_id: (data as any).owner_id } as any) as Task;
    }

    static async addSubtask(taskId: string, title: string): Promise<any> {
        const { data, error } = await supabase
            .from('subtasks')
            .insert([{ task_id: taskId, title, is_completed: false }])
            .select()
            .single();

        if (error) {
            throw new Error(error.message);
        }

        return data;
    }

    static async toggleSubtask(subtaskId: string, isCompleted: boolean): Promise<any> {
        const { data, error } = await supabase
            .from('subtasks')
            .update({ is_completed: isCompleted })
            .eq('subtask_id', subtaskId)
            .select()
            .single();

        if (error) {
            throw new Error(error.message);
        }

        return data;
    }

    static async addReminder(taskId: string, remindTime: Date): Promise<any> {
        const { data, error } = await supabase
            .from('reminders')
            .insert([{ task_id: taskId, remind_time: remindTime, status: 'pending' }])
            .select()
            .single();

        if (error) {
            throw new Error(error.message);
        }

        return data;
    }
}
