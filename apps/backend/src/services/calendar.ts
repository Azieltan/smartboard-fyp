import { supabase } from '../lib/supabase';

export interface CalendarEvent {
    event_id: string;
    title: string;
    start_time: string;
    end_time: string;
    user_id: string;
}

export class CalendarService {
    static async createEvent(event: Partial<CalendarEvent>): Promise<CalendarEvent> {
        const { data, error } = await supabase
            .from('calendar_events')
            .insert([event])
            .select()
            .single();

        if (error) {
            throw new Error(error.message);
        }

        return data as CalendarEvent;
    }

    static async getEvents(userId: string): Promise<CalendarEvent[]> {
        const { data, error } = await supabase
            .from('calendar_events')
            .select('*')
            .eq('user_id', userId)
            .order('start_time', { ascending: true });

        if (error) {
            throw new Error(error.message);
        }

        return data as CalendarEvent[];
    }

    static async getAllCalendarItems(userId: string): Promise<any[]> {
        // Fetch Events
        const events = await this.getEvents(userId);

        // Fetch Tasks with due dates
        const { data: tasks, error: taskError } = await supabase
            .from('tasks')
            .select('*')
            .eq('user_id', userId)
            .not('due_date', 'is', null);

        if (taskError) throw new Error(taskError.message);

        // Fetch Reminders
        // Note: Reminders are linked to tasks or events, but we might want to show them independently or just rely on the task/event
        // For now, let's just return events and tasks formatted for the calendar

        const formattedEvents = events.map(e => ({
            id: e.event_id,
            title: e.title,
            start: e.start_time,
            end: e.end_time,
            type: 'event'
        }));

        const formattedTasks = (tasks || []).map(t => ({
            id: t.task_id,
            title: `Task: ${t.title}`,
            start: t.due_date,
            end: t.due_date, // Tasks are point-in-time for now
            type: 'task',
            priority: t.priority
        }));

        return [...formattedEvents, ...formattedTasks];
    }
}
