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
