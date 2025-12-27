
import { supabase } from '../lib/supabase';

export class AdminService {
  static async getStats() {
    try {
      // 1. Total Users
      const { count: totalUsers, error: userError } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });

      if (userError) throw userError;

      // 2. Active Tasks (status != 'done')
      const { count: activeTasks, error: taskError } = await supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .neq('status', 'done');

      if (taskError) throw taskError;

      // 3. Recent Activity (Latest 5 users joined)
      // We could also fetch latest tasks, but user registration is a good proxy for "activity" for now
      const { data: recentUsers, error: activityError } = await supabase
        .from('users')
        .select('user_id, user_name, email, created_at')
        .order('created_at', { ascending: false })
        .limit(5);

      if (activityError) throw activityError;

      return {
        totalUsers: totalUsers || 0,
        activeTasks: activeTasks || 0,
        systemStatus: 'Healthy', // Placeholder for now, could check DB connection
        recentActivity: recentUsers?.map(user => ({
          type: 'User registration',
          description: `New user ${user.user_name} joined`,
          timestamp: user.created_at
        })) || []
      };
    } catch (error) {
      console.error('AdminService.getStats error:', error);
      throw error;
    }
  }
}
