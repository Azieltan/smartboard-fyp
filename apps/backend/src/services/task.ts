import { supabase } from '../lib/supabase';
import { Task } from '@smartboard/home';

export class TaskService {
    static async getAllTasks(userId?: string): Promise<Task[]> {
        if (!userId) {
            const { data, error } = await supabase.from('tasks').select('*, subtasks(*), owner:users!tasks_created_by_fkey(user_name), assignee:users!tasks_assignee_id_fkey(user_name)');
            if (error) throw new Error(error.message);
            return data as Task[];
        }

        // 1. Get my groups
        const { data: groupMembers, error: groupError } = await supabase
            .from('group_members')
            .select('group_id')
            .eq('user_id', userId)
            .eq('status', 'active');

        if (groupError) throw new Error(groupError.message);

        const myGroupIds = (groupMembers || []).map(g => g.group_id);

        // 2. Build Query
        let orCondition = `assignee_id.eq.${userId},created_by.eq.${userId}`;
        if (myGroupIds.length > 0) {
            const groupsStr = `(${myGroupIds.map(id => `"${id}"`).join(',')})`;
            orCondition += `,group_id.in.${groupsStr}`;
        }

        const { data, error } = await supabase
            .from('tasks')
            .select('*, subtasks(*), owner:users!tasks_created_by_fkey(user_name), assignee:users!tasks_assignee_id_fkey(user_name)')
            .or(orCondition);

        if (error) {
            throw new Error(error.message);
        }

        return data as Task[];
    }

    static async createTask(task: Partial<Task> & { subtasks?: { title: string; description?: string }[] }): Promise<Task> {
        // Extract subtasks from the typed object first
        const { subtasks, ...taskData } = task;

        // Use DB columns directly. Schema has assignee_id and created_by.
        const insertPayload: any = { ...taskData };
        delete insertPayload.edited_by;

        const { data: newTask, error } = await supabase
            .from('tasks')
            .insert([insertPayload])
            .select()
            .single();

        if (error) {
            throw new Error(error.message);
        }

        // Handle Subtasks Creation
        if (subtasks && subtasks.length > 0) {
            const subtaskInserts = subtasks.map((s: { title: string; description?: string }) => ({
                task_id: newTask.task_id,
                title: s.title,
                description: s.description,
                is_completed: false
            }));

            const { error: subError } = await supabase
                .from('subtasks')
                .insert(subtaskInserts);

            if (subError) console.error('Failed to create subtasks:', subError);
        }

        // Notification Logic
        try {
            const { ChatService } = require('./chat');
            const { GroupService } = require('./group');

            let assigneeName = '';
            if (insertPayload.assignee_id && insertPayload.assignee_id !== insertPayload.created_by) {
                const { data: user } = await supabase.from('users').select('user_name').eq('user_id', insertPayload.assignee_id).single();
                if (user) assigneeName = ` (Assigned to: ${user.user_name})`;
            }

            const messageContent = `📋 New Task Created: **${insertPayload.title}**${assigneeName}\nDue: ${insertPayload.due_date ? new Date(insertPayload.due_date).toLocaleDateString() : 'No Date'}`;

            // 1. Group Notification
            if (insertPayload.group_id) {
                const chat = await ChatService.getChatByGroupId(insertPayload.group_id);
                if (chat) {
                    await ChatService.sendMessage(chat.chat_id, insertPayload.created_by || 'system', messageContent);
                }
            }
            // 2. Individual Notification (if assigned to someone else)
            else if (insertPayload.assignee_id && insertPayload.assignee_id !== insertPayload.created_by) {
                const groupId = await GroupService.getOrCreateDirectChat(insertPayload.created_by, insertPayload.assignee_id);
                let chat = await ChatService.getChatByGroupId(groupId);
                if (!chat) chat = await ChatService.createChat(groupId);

                await ChatService.sendMessage(chat.chat_id, insertPayload.created_by || 'system', messageContent);
            }
        } catch (notifyError) {
            console.error('Failed to send task notification:', notifyError);
            // Don't fail the task creation just because notification failed
        }

        return newTask as Task;
    }

    static async updateTask(taskId: string, updates: Partial<Task>, userId?: string): Promise<Task> {
        // 1. Fetch existing task to check permissions
        const { data: task, error: fetchError } = await supabase
            .from('tasks')
            .select('*')
            .eq('task_id', taskId)
            .single();

        if (fetchError || !task) throw new Error(fetchError?.message || 'Task not found');

        // 2. Permission Logic
        if (userId) {
            const isCreator = task.created_by === userId;
            const isAssignee = task.assignee_id === userId;

            // Creator can update everything
            if (!isCreator) {
                // Assignee can ONLY update status (e.g. to 'in_progress', 'done' via Mark as Done)
                // But wait, Mark as Done calls this. Submit calls this.
                // We should strictly limit what fields non-creators can touch.
                const allowedFieldsForAssignee = ['status'];
                const attemptedFields = Object.keys(updates);
                const hasForbiddenUpdates = attemptedFields.some(f => !allowedFieldsForAssignee.includes(f));

                if (hasForbiddenUpdates) {
                    // If they are not the creator, and trying to update something else, BLOCK IT.
                    // Exception: If it's a shared task in a group? logic says "Task Creator or Authorized Roles".
                    // For now, strict: Only Creator edits details. Assignee updates status.
                    if (!isAssignee) {
                        throw new Error('Unauthorized: Only the task creator or assignee can update this task.');
                    }
                    if (hasForbiddenUpdates) {
                        throw new Error('Unauthorized: Assignees can only update task status.');
                    }
                }
            }
        }

        const updatePayload: any = { ...updates };
        delete updatePayload.created_by;
        delete updatePayload.edited_by;
        // delete updatePayload.user_id; // Allow re-assigning? Only creator can, checked above.

        const { data, error } = await supabase
            .from('tasks')
            .update(updatePayload)
            .eq('task_id', taskId)
            .select('*, owner:users!tasks_created_by_fkey(user_name), assignee:users!tasks_assignee_id_fkey(user_name)')
            .single();

        if (error) {
            throw new Error(error.message);
        }

        return data as Task;
    }

    static async addSubtask(taskId: string, title: string, description?: string): Promise<any> {
        const { data, error } = await supabase
            .from('subtasks')
            .insert([{ task_id: taskId, title, description, is_completed: false }])
            .select()
            .single();

        if (error) {
            throw new Error(error.message);
        }

        return data;
    }

    static async toggleSubtask(subtaskId: string, isCompleted: boolean): Promise<any> {
        const { data, error } = await supabase
            .from('subtasks')
            .update({ is_completed: isCompleted })
            .eq('subtask_id', subtaskId)
            .select()
            .single();

        if (error) {
            throw new Error(error.message);
        }

        return data;
    }

    static async updateSubtaskTitle(subtaskId: string, title: string): Promise<any> {
        const { data, error } = await supabase
            .from('subtasks')
            .update({ title })
            .eq('subtask_id', subtaskId)
            .select()
            .single();

        if (error) throw new Error(error.message);
        return data;
    }

    static async addSubtaskAttachment(subtaskId: string, fileUrl: string): Promise<any> {
        // Query current attachments first
        const { data: current, error: fetchError } = await supabase
            .from('subtasks')
            .select('attachments')
            .eq('subtask_id', subtaskId)
            .single();

        if (fetchError) throw new Error(fetchError.message);

        const currentAttachments = current.attachments || [];
        const newAttachments = [...currentAttachments, fileUrl];

        const { data, error } = await supabase
            .from('subtasks')
            .update({ attachments: newAttachments })
            .eq('subtask_id', subtaskId)
            .select()
            .single();

        if (error) throw new Error(error.message);
        return data;
    }

    static async addReminder(taskId: string, remindTime: Date): Promise<any> {
        const { data, error } = await supabase
            .from('reminders')
            .insert([{ task_id: taskId, remind_time: remindTime, status: 'pending' }])
            .select()
            .single();

        if (error) {
            throw new Error(error.message);
        }

        return data;
    }
    static async submitTask(taskId: string, userId: string, content: string, attachments: string[] = []): Promise<any> {
        // 1. Create Submission
        const { data: submission, error } = await supabase
            .from('task_submissions')
            .insert([{
                task_id: taskId,
                user_id: userId,
                content,
                attachments,
                status: 'pending'
            }])
            .select()
            .single();

        if (error) throw new Error(error.message);

        // 2. Update Task Status -> in_review
        await this.updateTask(taskId, { status: 'in_review' } as any);

        // 3. Notify Task Creator
        try {
            const { data: task } = await supabase.from('tasks').select('created_by, title').eq('task_id', taskId).single();
            if (task) {
                const { NotificationService } = require('./notification');
                await NotificationService.createNotification(
                    task.created_by,
                    'task_submission',
                    {
                        title: 'Task Submitted',
                        message: `Task "${task.title}" has been submitted for review.`,
                        taskId,
                        submissionId: submission.submission_id
                    }
                );
            }
        } catch (e) {
            console.error('Failed to notify task creator', e);
        }

        return submission;
    }

    static async reviewSubmission(submissionId: string, status: 'approved' | 'rejected', feedback?: string): Promise<any> {
        // 1. Update Submission
        const { data: submission, error } = await supabase
            .from('task_submissions')
            .update({ status, feedback, reviewed_at: new Date() })
            .eq('submission_id', submissionId)
            .select()
            .single();

        if (error) throw new Error(error.message);

        // 2. Update Task Status
        const { data: task } = await supabase.from('tasks').select('*').eq('task_id', submission.task_id).single();
        if (task) {
            const newStatus = status === 'approved' ? 'done' : 'todo';
            await this.updateTask(task.task_id, { status: newStatus } as any);

            // 3. Notify Submitter
            try {
                const { NotificationService } = require('./notification');
                await NotificationService.createNotification(
                    submission.user_id,
                    'task_review',
                    {
                        title: `Task ${status === 'approved' ? 'Approved' : 'Rejected'}`,
                        message: `Your submission for "${task.title}" was ${status}.${feedback ? ` Feedback: ${feedback}` : ''}`,
                        taskId: task.task_id
                    }
                );
            } catch (e) {
                console.error('Failed to notify submitter', e);
            }
        }

        return submission;
    }

    static async getTaskSubmission(taskId: string): Promise<any> {
        const { data, error } = await supabase
            .from('task_submissions')
            .select('*')
            .eq('task_id', taskId)
            .order('submitted_at', { ascending: false })
            .limit(1)
            .maybeSingle();

        if (error) throw new Error(error.message);
        return data;
    }

    static async getTaskSubmissions(taskId: string): Promise<any[]> {
        const { data, error } = await supabase
            .from('task_submissions')
            .select('*')
            .eq('task_id', taskId)
            .order('submitted_at', { ascending: false });

        if (error) throw new Error(error.message);
        return data || [];
    }


    static async getTaskWithSubtasks(taskId: string): Promise<any> {
        const { data: task, error } = await supabase
            .from('tasks')
            .select('*, subtasks(*), owner:users!tasks_created_by_fkey(user_name), assignee:users!tasks_assignee_id_fkey(user_name)')
            .eq('task_id', taskId)
            .single();

        if (error) throw new Error(error.message);
        return task;
    }
}


