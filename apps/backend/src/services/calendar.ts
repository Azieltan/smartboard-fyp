import { supabase } from '../lib/supabase';
import { TaskService } from './task';

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
        // Use DB columns directly
        const eventData: any = { ...event };

        // Ensure shared_with is at least an empty array
        eventData.shared_with = eventData.shared_with || [];

        const { data, error } = await supabase
            .from('calendar_events')
            .insert([eventData])
            .select()
            .single();

        if (error) {
            throw new Error(error.message);
        }

        // Notification Logic
        try {
            // Import dynamically to avoid circular dependency
            const { ChatService } = require('./chat');
            const { GroupService } = require('./group');

            const messageContent = `📅 New Event: **${eventData.title}**\nTime: ${new Date(eventData.start_time).toLocaleString()}`;

            // 1. Group Notification
            if (eventData.shared_with_group_id) {
                const chat = await ChatService.getChatByGroupId(eventData.shared_with_group_id);
                if (chat) {
                    await ChatService.sendMessage(chat.chat_id, eventData.user_id || 'system', messageContent);
                }
            }

            // 2. Direct Share Notification (to Friend)
            if (eventData.shared_with && eventData.shared_with.length > 0) {
                for (const friendId of eventData.shared_with) {
                    // Find or create DM
                    const groupId = await GroupService.getOrCreateDirectChat(eventData.user_id, friendId);
                    let chat = await ChatService.getChatByGroupId(groupId);
                    if (!chat) chat = await ChatService.createChat(groupId);

                    await ChatService.sendMessage(chat.chat_id, eventData.user_id || 'system', messageContent);
                }
            }
        } catch (notifyError) {
            console.error('Failed to send event notification:', notifyError);
        }

        return data as CalendarEvent;
    }

    static async getEvents(userId: string): Promise<CalendarEvent[]> {
        // Fetch events where:
        // 1) user_id = userId (Owned by user)
        // 2) shared_with_group_id IN my groups
        // 3) shared_with array contains userId (using contains operator for text[] or jsonb)

        try {
            // Get my active group memberships
            const { data: groupMembers, error: groupError } = await supabase
                .from('group_members')
                .select('group_id')
                .eq('user_id', userId)
                .eq('status', 'active');

            if (groupError) throw new Error(`Group fetch error: ${groupError.message}`);
            const myGroupIds = (groupMembers || []).map(g => g.group_id);

            // Fetch all relevant events
            const queries = [
                // 1. My events
                supabase
                    .from('calendar_events')
                    .select('*')
                    .eq('user_id', userId),

                // 2. Shared directly with me
                // Note: 'shared_with' is text[] or jsonb. 'cs' (contains) works for both.
                supabase
                    .from('calendar_events')
                    .select('*')
                    .contains('shared_with', [userId])
            ];

            // 3. Group events (only if in groups)
            if (myGroupIds.length > 0) {
                queries.push(
                    supabase
                        .from('calendar_events')
                        .select('*')
                        .in('shared_with_group_id', myGroupIds)
                );
            }

            const results = await Promise.all(queries);

            // Collect all events
            const allEvents: CalendarEvent[] = [];
            for (const res of results) {
                if (res.error) console.error("Event fetch warning:", res.error.message);
                if (res.data) allEvents.push(...(res.data as any[]));
            }

            // Deduplicate by event_id
            const uniqueEvents = new Map<string, CalendarEvent>();
            allEvents.forEach(e => uniqueEvents.set(e.event_id, e));

            return Array.from(uniqueEvents.values())
                .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());

        } catch (error: any) {
            console.error("Critical error in getEvents:", error);
            // Return empty array instead of crashing on calendar load
            return [];
        }
    }

    static async getAllCalendarItems(userId: string): Promise<any[]> {
        // Fetch Events
        const events = await this.getEvents(userId);

        // Fetch Tasks via TaskService (centralized logic)
        let tasks: any[] = [];
        try {
            const allTasks = await TaskService.getAllTasks(userId);
            // Only tasks with due dates
            tasks = allTasks.filter(t => t.due_date);
        } catch (error: any) {
            console.error('Failed to fetch tasks for calendar:', error);
            // Don't crash calendar if tasks fail
        }

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
