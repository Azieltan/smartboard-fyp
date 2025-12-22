import { supabase } from '../lib/supabase';

export interface CalendarEvent {
    event_id: string;
    title: string;
    start_time: string;
    end_time: string;
    user_id: string; // API: creator id (frontend expects user_id)
    shared_with_group_id?: string; // API: group share id
    shared_with_user_ids?: string[]; // Optional: specific friends (requires DB support for array or separate table, simulating with JSON or logic)
    // Note: To support 'shared_with_user_ids' properly in Supabase without a new table, we often use a JSONB column 'attendees' or similar.
    // For this implementation, we'll assume we add a 'shared_with' JSONB column to 'calendar_events'.
    shared_with?: string[];
}

export class CalendarService {
    static async createEvent(event: Partial<CalendarEvent>): Promise<CalendarEvent> {
        // Map API payload -> DB columns
        const eventData: any = { ...event };
        eventData.shared_with = eventData.shared_with || [];
        if (!eventData.creator_id && eventData.user_id) eventData.creator_id = eventData.user_id;
        if (!eventData.shared_group_id && eventData.shared_with_group_id) eventData.shared_group_id = eventData.shared_with_group_id;
        delete eventData.user_id;
        delete eventData.shared_with_group_id;

        const { data, error } = await supabase
            .from('calendar_events')
            .insert([eventData])
            .select()
            .single();

        if (error) {
            throw new Error(error.message);
        }

        // Map DB -> API
        return ({
            ...data,
            user_id: (data as any).creator_id,
            shared_with_group_id: (data as any).shared_group_id
        } as any) as CalendarEvent;
    }

    static async getEvents(userId: string): Promise<CalendarEvent[]> {
        // We need to fetch events where:
        // 1. user_id = userId (Created by me)
        // 2. shared_with_group_id IN (my_group_ids)
        // 3. shared_with contains userId (Shared with me directly)

        // First, get my group IDs
        const { data: groupMembers, error: groupError } = await supabase
            .from('group_members')
            .select('group_id')
            .eq('user_id', userId)
            .eq('status', 'active');

        if (groupError) throw new Error(groupError.message);
        const myGroupIds = groupMembers.map(g => g.group_id);

        // Supabase 'or' syntax is tricky for mixed AND/OR logic.
        // Simplest strategy: Fetch by Creator OR Group OR Shared Array
        // We'll use the .or() filter string.

        // Construct the OR filter
        // creator_id.eq.userId, shared_group_id.in.(...ids), shared_with.cs.{userId} (contains)

        let orQuery = `creator_id.eq.${userId}`;
        if (myGroupIds.length > 0) {
            orQuery += `,shared_group_id.in.(${myGroupIds.join(',')})`;
        }
        // NOTE: 'cs' filter for JSON/Array column requires PostgREST support. assuming 'shared_with' is text[] or jsonb.
        // If 'shared_with' is simple text array:
        orQuery += `,shared_with.cs.{${userId}}`;

        const { data, error } = await supabase
            .from('calendar_events')
            .select('*')
            .or(orQuery)
            .order('start_time', { ascending: true });

        if (error) {
            throw new Error(error.message);
        }

        return (data || []).map((e: any) => ({
            ...e,
            user_id: e.creator_id,
            shared_with_group_id: e.shared_group_id
        })) as CalendarEvent[];
    }

    static async getAllCalendarItems(userId: string): Promise<any[]> {
        // Fetch Events
        const events = await this.getEvents(userId);

        // Fetch Tasks with due dates
        const { data: tasks, error: taskError } = await supabase
            .from('tasks')
            .select('*')
            .eq('owner_id', userId)
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
            type: 'event',
            // Add metadata for frontend to show "Shared" icon
            isShared: e.user_id !== userId || (e.shared_with && e.shared_with.length > 0) || !!e.shared_with_group_id,
            group_id: e.shared_with_group_id
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
