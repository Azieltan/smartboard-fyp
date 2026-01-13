import { supabase } from '../lib/supabase';

interface SearchResult {
  id: string;
  type: 'task' | 'event' | 'message' | 'user' | 'group';
  title: string;
  subtitle?: string;
  link?: string;
}

export class SearchService {
  static async search(userId: string, query: string): Promise<SearchResult[]> {
    if (!query || query.length < 2) return [];

    const searchTerm = `%${query.toLowerCase()}%`;
    const results: SearchResult[] = [];

    try {
      // 1. Search Tasks (user's tasks or tasks in their groups)
      const { data: tasks } = await supabase
        .from('tasks')
        .select('task_id, title, description, group_id')
        .or(`title.ilike.${searchTerm},description.ilike.${searchTerm}`)
        .limit(10);

      if (tasks) {
        results.push(...tasks.map(t => ({
          id: t.task_id,
          type: 'task' as const,
          title: t.title,
          subtitle: t.description?.substring(0, 50) || 'Task',
          link: `/dashboard/tasks?task=${t.task_id}`
        })));
      }

      // 2. Search Calendar Events
      const { data: events } = await supabase
        .from('calendar_events')
        .select('event_id, title, description')
        .or(`title.ilike.${searchTerm},description.ilike.${searchTerm}`)
        .limit(10);

      if (events) {
        results.push(...events.map(e => ({
          id: e.event_id,
          type: 'event' as const,
          title: e.title,
          subtitle: e.description?.substring(0, 50) || 'Event',
          link: `/dashboard/calendar`
        })));
      }

      // 3. Search Messages
      const { data: messages } = await supabase
        .from('messages')
        .select('message_id, content, chat_id')
        .ilike('content', searchTerm)
        .limit(10);

      if (messages) {
        results.push(...messages.map(m => ({
          id: m.message_id,
          type: 'message' as const,
          title: m.content.substring(0, 60) + (m.content.length > 60 ? '...' : ''),
          subtitle: 'Message',
          link: `/dashboard/chat`
        })));
      }

      // 4. Search Users
      const { data: users } = await supabase
        .from('users')
        .select('user_id, user_name, email')
        .or(`user_name.ilike.${searchTerm},email.ilike.${searchTerm}`)
        .neq('user_id', userId)
        .limit(5);

      if (users) {
        results.push(...users.map(u => ({
          id: u.user_id,
          type: 'user' as const,
          title: u.user_name,
          subtitle: u.email
        })));
      }

      // 5. Search Groups
      const { data: groups } = await supabase
        .from('groups')
        .select('group_id, name, description')
        .or(`name.ilike.${searchTerm},description.ilike.${searchTerm}`)
        .limit(5);

      if (groups) {
        results.push(...groups.map(g => ({
          id: g.group_id,
          type: 'group' as const,
          title: g.name,
          subtitle: g.description || 'Group',
          link: `/dashboard/chat?group=${g.group_id}`
        })));
      }

      return results;
    } catch (error) {
      console.error('Search error:', error);
      return [];
    }
  }
}
