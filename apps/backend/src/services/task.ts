import { supabase } from '../lib/supabase';
import { Task } from '@smartboard/home';

export class TaskService {
    static async getAllTasks(): Promise<Task[]> {
        const { data, error } = await supabase
            .from('tasks')
            .select('*');

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
}
