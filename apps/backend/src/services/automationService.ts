import axios from 'axios';
import { supabase } from '../lib/supabase';
import { v4 as uuidv4 } from 'uuid';

// Import existing services for execution
import { TaskService } from './task';
import { CalendarService } from './calendar';
import { GroupService } from './group';

const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL || 'https://n8n.h5preact.app/webhook/smarty-automate';

interface AutomationResult {
  automation_id: string;
  success: boolean;
  needs_confirmation: boolean;
  action: string;
  summary: string;
  params?: any;
}

export class AutomationService {

  /**
   * Step 1: Parse user intent via n8n + DeepSeek AI
   */
  static async initiateAutomation(userId: string, rawText: string, context?: any): Promise<AutomationResult> {
    const automation_id = uuidv4();

    try {
      // Call n8n for AI parsing (DeepSeek v3.2)
      console.log('[AutomationService] Calling n8n webhook:', N8N_WEBHOOK_URL);
      console.log('[AutomationService] Request payload:', { automation_id, user_id: userId, rawText });

      const response = await axios.post(N8N_WEBHOOK_URL, {
        automation_id,
        user_id: userId,
        rawText,
        timezone: context?.timezone || 'Asia/Kuala_Lumpur'
      }, { timeout: 60000 }); // 60s timeout for DeepSeek

      const result = response.data;

      console.log('[AutomationService] n8n response:', JSON.stringify(result, null, 2));
      console.log('[AutomationService] needs_confirmation:', result.needs_confirmation);

      // Store in DB for audit
      await supabase.from('automation_requests').insert({
        automation_id,
        user_id: userId,
        raw_text: rawText,
        summary: result.summary,
        payload: result.params ? { action: result.action, params: result.params } : null,
        status: result.needs_confirmation ? 'pending' : 'failed'
      });

      return {
        automation_id,
        success: result.success,
        needs_confirmation: result.needs_confirmation,
        action: result.action,
        summary: result.summary,
        params: result.params
      };

    } catch (error: any) {
      console.error('[AutomationService] Error:', error.message);

      // Store failed attempt
      try {
        await supabase.from('automation_requests').insert({
          automation_id,
          user_id: userId,
          raw_text: rawText,
          status: 'failed'
        });
      } catch (err) {
        // Ignore if this also fails
      }

      return {
        automation_id,
        success: false,
        needs_confirmation: false,
        action: 'error',
        summary: "Sorry, I couldn't process that right now. Please try again."
      };
    }
  }

  /**
   * Step 2: Execute confirmed action (backend handles execution, not n8n)
   */
  static async confirmAutomation(userId: string, automation_id: string): Promise<any> {
    // Fetch the pending automation
    const { data: automation, error } = await supabase
      .from('automation_requests')
      .select('*')
      .eq('automation_id', automation_id)
      .eq('user_id', userId)
      .eq('status', 'pending')
      .single();

    if (error || !automation) {
      throw new Error('Automation request not found or already processed');
    }

    const { action, params } = automation.payload || {};

    if (!action) {
      throw new Error('No action found in automation payload');
    }

    // Update status to executing
    await supabase.from('automation_requests')
      .update({ status: 'executing', updated_at: new Date() })
      .eq('automation_id', automation_id);

    try {
      let result;

      switch (action) {
        case 'create_task':
          result = await this.executeCreateTask(userId, params);
          break;

        case 'create_reminder':
          result = await this.executeCreateReminder(userId, params);
          break;

        case 'create_calendar_event':
          result = await this.executeCreateEvent(userId, params);
          break;

        case 'add_member_to_group':
          result = await this.executeAddMember(userId, params);
          break;

        case 'remove_member_from_group':
          result = await this.executeRemoveMember(userId, params);
          break;

        case 'mark_task_done':
          result = await this.executeMarkTaskDone(userId, params);
          break;

        case 'create_group':
          result = await this.executeCreateGroup(userId, params);
          break;

        case 'list_group_members':
          result = await this.executeListMembers(userId, params);
          break;

        case 'delete_task':
        case 'delete_reminder':
          result = await this.executeDeleteTask(userId, params);
          break;

        case 'update_task':
        case 'update_reminder':
          result = await this.executeUpdateTask(userId, params);
          break;

        case 'get_tasks':
        case 'list_tasks':
          result = await this.executeListTasks(userId, params);
          break;

        default:
          throw new Error(`Unknown action: ${action}`);
      }

      // Update status to done
      await supabase.from('automation_requests')
        .update({ status: 'done', updated_at: new Date() })
        .eq('automation_id', automation_id);

      return { success: true, message: result.message, details: result.details };

    } catch (error: any) {
      // Update status to failed
      await supabase.from('automation_requests')
        .update({ status: 'failed', updated_at: new Date() })
        .eq('automation_id', automation_id);

      throw error;
    }
  }

  // ============ Execution Methods ============

  private static async executeCreateTask(userId: string, params: any) {
    const dueDate = params.due_date ? new Date(params.due_date) : undefined;

    // Find group if specified
    let groupId: string | undefined;
    if (params.group_name) {
      const { data: group } = await supabase
        .from('groups')
        .select('group_id')
        .ilike('name', `%${params.group_name}%`)
        .single();
      groupId = group?.group_id;
    }

    const task = await TaskService.createTask({
      title: params.title,
      description: params.description,
      due_date: dueDate,
      priority: params.priority || 'medium',
      status: 'todo',
      user_id: userId,
      group_id: groupId
    });

    const groupMsg = groupId ? ` in group "${params.group_name}"` : '';
    const dueMsg = dueDate ? ` (due: ${dueDate.toLocaleDateString()})` : '';

    return {
      message: `✅ Created task: "${task.title}"${groupMsg}${dueMsg}`,
      details: task
    };
  }

  private static async executeCreateReminder(userId: string, params: any) {
    const remindAt = new Date(params.remind_at);

    // Create a task as reminder anchor
    const task = await TaskService.createTask({
      title: `🔔 ${params.title}`,
      description: `Reminder set for ${remindAt.toLocaleString()}`,
      due_date: remindAt,
      priority: 'medium',
      status: 'todo',
      user_id: userId
    });

    // Add reminder record
    await TaskService.addReminder(task.task_id, remindAt);

    return {
      message: `✅ Reminder set: "${params.title}" at ${remindAt.toLocaleString()}`,
      details: task
    };
  }

  private static async executeCreateEvent(userId: string, params: any) {
    const startTime = new Date(params.start_time);
    let endTime = params.end_time ? new Date(params.end_time) : new Date(startTime);

    if (!params.end_time) {
      endTime.setHours(endTime.getHours() + (params.duration_hours || 1));
    }

    const event = await CalendarService.createEvent({
      title: params.title,
      start_time: startTime.toISOString(),
      end_time: endTime.toISOString(),
      user_id: userId
    });

    return {
      message: `✅ Created event: "${params.title}" on ${startTime.toLocaleString()}`,
      details: event
    };
  }

  private static async executeAddMember(userId: string, params: any) {
    // Find user by name
    const { data: user } = await supabase
      .from('users')
      .select('user_id, user_name')
      .ilike('user_name', `%${params.user_name}%`)
      .single();

    if (!user) throw new Error(`Could not find user "${params.user_name}"`);

    // Find group by name
    const { data: group } = await supabase
      .from('groups')
      .select('group_id, name')
      .ilike('name', `%${params.group_name}%`)
      .single();

    if (!group) throw new Error(`Could not find group "${params.group_name}"`);

    await GroupService.addMember(group.group_id, user.user_id, 'member');

    return {
      message: `✅ Added ${user.user_name} to ${group.name}`,
      details: { user, group }
    };
  }

  private static async executeRemoveMember(userId: string, params: any) {
    const { data: user } = await supabase
      .from('users')
      .select('user_id, user_name')
      .ilike('user_name', `%${params.user_name}%`)
      .single();

    if (!user) throw new Error(`Could not find user "${params.user_name}"`);

    const { data: group } = await supabase
      .from('groups')
      .select('group_id, name')
      .ilike('name', `%${params.group_name}%`)
      .single();

    if (!group) throw new Error(`Could not find group "${params.group_name}"`);

    await supabase.from('group_members')
      .delete()
      .eq('group_id', group.group_id)
      .eq('user_id', user.user_id);

    return {
      message: `✅ Removed ${user.user_name} from ${group.name}`,
      details: { user, group }
    };
  }

  private static async executeMarkTaskDone(userId: string, params: any) {
    const { data: task } = await supabase
      .from('tasks')
      .select('task_id, title')
      .ilike('title', `%${params.task_title}%`)
      .eq('user_id', userId)
      .single();

    if (!task) throw new Error(`Could not find task "${params.task_title}"`);

    await TaskService.updateTask(task.task_id, { status: 'done' });

    return {
      message: `✅ Marked "${task.title}" as done`,
      details: task
    };
  }

  private static async executeCreateGroup(userId: string, params: any) {
    const group = await GroupService.createGroup(params.group_name, userId);

    return {
      message: `✅ Created group: "${group.name}"`,
      details: group
    };
  }

  private static async executeListMembers(userId: string, params: any) {
    const { data: group } = await supabase
      .from('groups')
      .select('group_id, name')
      .ilike('name', `%${params.group_name}%`)
      .single();

    if (!group) throw new Error(`Could not find group "${params.group_name}"`);

    const { data: members } = await supabase
      .from('group_members')
      .select('role, users(user_name)')
      .eq('group_id', group.group_id);

    const memberList = (members || [])
      .map((m: any) => `• ${m.users?.user_name || 'Unknown'} (${m.role})`)
      .join('\n');

    return {
      message: `Members of "${group.name}":\n${memberList || 'No members yet'}`,
      details: { group, members }
    };
  }

  // Delete a task or reminder
  private static async executeDeleteTask(userId: string, params: any) {
    const searchTitle = params.task_title || params.title || params.reminder_title;

    if (!searchTitle) {
      throw new Error('Please specify which task or reminder to delete. Try: "Delete task [task name]"');
    }

    const { data: task } = await supabase
      .from('tasks')
      .select('task_id, title')
      .ilike('title', `%${searchTitle}%`)
      .eq('user_id', userId)
      .single();

    if (!task) {
      throw new Error(`Could not find task or reminder matching "${searchTitle}". Please check the name and try again.`);
    }

    await supabase.from('tasks').delete().eq('task_id', task.task_id);

    return {
      message: `✅ Deleted: "${task.title}"`,
      details: task
    };
  }

  // Update a task or reminder
  private static async executeUpdateTask(userId: string, params: any) {
    const searchTitle = params.task_title || params.title || params.reminder_title;

    if (!searchTitle) {
      throw new Error('Please specify which task or reminder to update. Try: "Update task [task name] to [new details]"');
    }

    const { data: task } = await supabase
      .from('tasks')
      .select('task_id, title, due_date, priority, description')
      .ilike('title', `%${searchTitle}%`)
      .eq('user_id', userId)
      .single();

    if (!task) {
      throw new Error(`Could not find task matching "${searchTitle}". Please check the name and try again.`);
    }

    const updates: any = {};
    if (params.new_title) updates.title = params.new_title;
    if (params.due_date) updates.due_date = new Date(params.due_date);
    if (params.priority) updates.priority = params.priority;
    if (params.description) updates.description = params.description;

    if (Object.keys(updates).length === 0) {
      throw new Error('Please specify what to update. Try: "Change task deadline to Friday" or "Update task priority to high"');
    }

    await supabase.from('tasks')
      .update({ ...updates, updated_at: new Date() })
      .eq('task_id', task.task_id);

    const changesList = Object.entries(updates)
      .map(([key, value]) => `${key}: ${value}`)
      .join(', ');

    return {
      message: `✅ Updated "${task.title}": ${changesList}`,
      details: { task, updates }
    };
  }

  // List tasks for user
  private static async executeListTasks(userId: string, params: any) {
    let query = supabase
      .from('tasks')
      .select('task_id, title, status, priority, due_date')
      .eq('user_id', userId)
      .order('due_date', { ascending: true });

    // Optional filters
    if (params.status) {
      query = query.eq('status', params.status);
    }
    if (params.priority) {
      query = query.eq('priority', params.priority);
    }

    const { data: tasks, error } = await query.limit(10);

    if (error) throw new Error('Failed to fetch tasks');

    if (!tasks || tasks.length === 0) {
      return {
        message: '📋 No tasks found. Create one by saying "Create task [title]"',
        details: []
      };
    }

    const taskList = tasks
      .map((t: any) => {
        const dueStr = t.due_date ? ` (due: ${new Date(t.due_date).toLocaleDateString()})` : '';
        const priorityEmoji = t.priority === 'high' ? '🔴' : t.priority === 'low' ? '🟢' : '🟡';
        return `${priorityEmoji} ${t.title}${dueStr} - ${t.status}`;
      })
      .join('\n');

    return {
      message: `📋 Your tasks:\n${taskList}`,
      details: tasks
    };
  }
}
