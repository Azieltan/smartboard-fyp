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
}
