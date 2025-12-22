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
        // Fetch events where:
        // 1) creator_id = userId
        // 2) shared_group_id IN my groups
        // 3) shared_with (jsonb array) contains userId

        // First, get my group IDs
        const { data: groupMembers, error: groupError } = await supabase
            .from('group_members')
            .select('group_id')
            .eq('user_id', userId)
            .eq('status', 'active');

        if (groupError) throw new Error(groupError.message);
        const myGroupIds = groupMembers.map(g => g.group_id);

        // For jsonb, `.contains()` is the most reliable way to filter shared_with.
        // We'll do 3 queries and union results in memory (small dataset per user).

        const [mine, byGroup, byShare] = await Promise.all([
            supabase
                .from('calendar_events')
                .select('*')
                .eq('creator_id', userId)
                .order('start_time', { ascending: true }),
            myGroupIds.length > 0
                ? supabase
                    .from('calendar_events')
                    .select('*')
                    .in('shared_group_id', myGroupIds)
                    .order('start_time', { ascending: true })
                : Promise.resolve({ data: [], error: null } as any),
            supabase
                .from('calendar_events')
                .select('*')
                .contains('shared_with', [userId])
                .order('start_time', { ascending: true })
        ]);

        const errors = [mine.error, byGroup.error, byShare.error].filter(Boolean);
        if (errors.length) {
            throw new Error((errors[0] as any).message);
        }

        const combined = [...(mine.data || []), ...(byGroup.data || []), ...(byShare.data || [])];
        const dedupedById = new Map<string, any>();
        for (const e of combined) dedupedById.set(e.event_id, e);

        return Array.from(dedupedById.values())
            .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
            .map((e: any) => ({
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
