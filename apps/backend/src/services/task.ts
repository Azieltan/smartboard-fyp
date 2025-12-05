import { supabase } from '../lib/supabase';
import { Task } from '@smartboard/home';

export class TaskService {
    static async getAllTasks(userId?: string): Promise<Task[]> {
        let query = supabase.from('tasks').select('*');

        if (userId) {
            query = query.eq('user_id', userId);
        }

        const { data, error } = await query;

        if (error) {
            throw new Error(error.message);
        }

        return data as Task[];
    }

    static async createTask(task: Partial<Task>): Promise<Task> {
        const { data, error } = await supabase
            .from('tasks')
            .insert([task])
            .select()
            .single();

        if (error) {
            throw new Error(error.message);
        }

        // Notification Logic
        if (task.group_id) {
            try {
                // Import dynamically to avoid circular dependency issues if any
                const { ChatService } = require('./chat');
                const chat = await ChatService.getChatByGroupId(task.group_id);
                if (chat) {
                    const messageContent = `📋 New Task Assigned: **${task.title}**\nDue: ${task.due_date ? new Date(task.due_date).toLocaleDateString() : 'No Date'}`;
                    await ChatService.sendMessage(chat.chat_id, task.created_by || 'system', messageContent);
                }
            } catch (notifyError) {
                console.error('Failed to send task notification:', notifyError);
                // Don't fail the task creation just because notification failed
            }
        }

        return data as Task;
    }
    static async updateTask(taskId: string, updates: Partial<Task>): Promise<Task> {
        const { data, error } = await supabase
            .from('tasks')
            .update(updates)
            .eq('task_id', taskId)
            .select()
            .single();

        if (error) {
            throw new Error(error.message);
        }

        return data as Task;
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
