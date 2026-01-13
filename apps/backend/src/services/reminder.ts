import { supabase } from '../lib/supabase';
import { NotificationService } from './notification';

export class ReminderService {
  /**
   * Check for tasks due within the next 24 hours and send reminders
   * This should be called periodically (e.g., every hour via cron or on app startup)
   */
  static async checkAndSendDueReminders(): Promise<number> {
    const now = new Date();
    const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    try {
      // Find tasks due within next 24 hours that haven't been reminded yet
      const { data: tasks, error } = await supabase
        .from('tasks')
        .select('task_id, title, due_date, user_id, reminder_sent')
        .gte('due_date', now.toISOString())
        .lte('due_date', in24Hours.toISOString())
        .or('reminder_sent.is.null,reminder_sent.eq.false')
        .eq('status', 'pending');

      if (error) {
        console.error('Failed to fetch tasks for reminders:', error);
        return 0;
      }

      if (!tasks || tasks.length === 0) return 0;

      let sentCount = 0;

      for (const task of tasks) {
        try {
          const dueDate = new Date(task.due_date);
          const hoursUntilDue = Math.round((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60));

          await NotificationService.createNotification(
            task.user_id,
            'task_reminder',
            {
              title: '⏰ Task Due Soon',
              message: `"${task.title}" is due in ${hoursUntilDue} hour${hoursUntilDue !== 1 ? 's' : ''}`,
              action_url: `/dashboard/tasks?task=${task.task_id}`
            }
          );

          // Mark reminder as sent
          await supabase
            .from('tasks')
            .update({ reminder_sent: true })
            .eq('task_id', task.task_id);

          sentCount++;
        } catch (e) {
          console.error(`Failed to send reminder for task ${task.task_id}:`, e);
        }
      }

      console.log(`[Reminders] Sent ${sentCount} due date reminders`);
      return sentCount;
    } catch (error) {
      console.error('Reminder service error:', error);
      return 0;
    }
  }

  /**
   * Start the reminder check interval (runs every hour)
   */
  static startReminderInterval(): NodeJS.Timeout {
    // Run immediately on startup
    this.checkAndSendDueReminders();

    // Then run every hour
    return setInterval(() => {
      this.checkAndSendDueReminders();
    }, 60 * 60 * 1000); // 1 hour
  }
}
