import { supabase } from '../lib/supabase';
import { GroupService } from './group';
import { TaskService } from './task';

interface AutomationResult {
    success: boolean;
    message: string;
    action?: string;
    details?: any;
}

interface ParsedCommand {
    action: string;
    entities: {
        userName?: string;
        groupName?: string;
        taskTitle?: string;
        taskDescription?: string;
        dueDate?: string;
        priority?: string;
        status?: string;
    };
}

export class AutomationService {
    /**
     * Main entry point for processing natural language automation commands
     */
    static async processCommand(userId: string, prompt: string): Promise<AutomationResult> {
        try {
            // Parse the natural language command
            const parsed = this.parseCommand(prompt);
            
            if (!parsed) {
                return {
                    success: false,
                    message: "I couldn't understand that command. Try something like:\n• 'Add John to the Marketing group'\n• 'Create a task called Review Report'\n• 'Remove Sarah from the Dev Team'"
                };
            }

            // Execute the appropriate action
            switch (parsed.action) {
                case 'add_member_to_group':
                    return await this.addMemberToGroup(userId, parsed.entities);
                
                case 'remove_member_from_group':
                    return await this.removeMemberFromGroup(userId, parsed.entities);
                
                case 'create_task':
                    return await this.createTask(userId, parsed.entities);
                
                case 'update_task_status':
                    return await this.updateTaskStatus(userId, parsed.entities);
                
                case 'create_group':
                    return await this.createGroup(userId, parsed.entities);
                
                case 'list_group_members':
                    return await this.listGroupMembers(userId, parsed.entities);
                
                default:
                    return {
                        success: false,
                        message: "I understood the command but this action isn't supported yet."
                    };
            }
        } catch (error: any) {
            console.error('[Automation] Error processing command:', error);
            return {
                success: false,
                message: `Error: ${error.message}`
            };
        }
    }

    /**
     * Parse natural language command into structured data
     */
    static parseCommand(prompt: string): ParsedCommand | null {
        const lowerPrompt = prompt.toLowerCase().trim();

        // Pattern: Add [user] to [group]
        const addMemberPattern = /add\s+(?:user\s+)?["']?([^"']+?)["']?\s+to\s+(?:the\s+)?(?:group\s+)?["']?([^"']+?)["']?(?:\s+group)?$/i;
        const addMatch = lowerPrompt.match(addMemberPattern);
        if (addMatch) {
            return {
                action: 'add_member_to_group',
                entities: {
                    userName: addMatch[1].trim(),
                    groupName: addMatch[2].trim()
                }
            };
        }

        // Pattern: Remove [user] from [group]
        const removeMemberPattern = /remove\s+(?:user\s+)?["']?([^"']+?)["']?\s+from\s+(?:the\s+)?(?:group\s+)?["']?([^"']+?)["']?(?:\s+group)?$/i;
        const removeMatch = lowerPrompt.match(removeMemberPattern);
        if (removeMatch) {
            return {
                action: 'remove_member_from_group',
                entities: {
                    userName: removeMatch[1].trim(),
                    groupName: removeMatch[2].trim()
                }
            };
        }

        // Pattern: Create task/todo [title] (optionally with due date and priority)
        const createTaskPattern = /(?:create|add|make)\s+(?:a\s+)?(?:new\s+)?(?:task|todo)\s+(?:called\s+|named\s+|titled\s+)?["']?(.+?)["']?(?:\s+(?:due|by)\s+(.+?))?(?:\s+(?:with\s+)?(?:priority\s+)?(low|medium|high))?$/i;
        const taskMatch = lowerPrompt.match(createTaskPattern);
        if (taskMatch) {
            return {
                action: 'create_task',
                entities: {
                    taskTitle: taskMatch[1].trim(),
                    dueDate: taskMatch[2]?.trim(),
                    priority: taskMatch[3]?.trim()
                }
            };
        }

        // Pattern: Mark task [title] as [status]
        const updateStatusPattern = /(?:mark|set|update)\s+(?:task\s+)?["']?(.+?)["']?\s+(?:as|to)\s+(todo|in[_\s]?progress|done|complete|completed)$/i;
        const statusMatch = lowerPrompt.match(updateStatusPattern);
        if (statusMatch) {
            let status = statusMatch[2].trim().toLowerCase();
            if (status === 'complete' || status === 'completed') status = 'done';
            if (status === 'in progress') status = 'in_progress';
            
            return {
                action: 'update_task_status',
                entities: {
                    taskTitle: statusMatch[1].trim(),
                    status: status
                }
            };
        }

        // Pattern: Create group [name]
        const createGroupPattern = /(?:create|add|make)\s+(?:a\s+)?(?:new\s+)?group\s+(?:called\s+|named\s+)?["']?(.+?)["']?$/i;
        const groupMatch = lowerPrompt.match(createGroupPattern);
        if (groupMatch) {
            return {
                action: 'create_group',
                entities: {
                    groupName: groupMatch[1].trim()
                }
            };
        }

        // Pattern: List/show members of [group]
        const listMembersPattern = /(?:list|show|get)\s+(?:all\s+)?members\s+(?:of|in|from)\s+(?:the\s+)?(?:group\s+)?["']?(.+?)["']?(?:\s+group)?$/i;
        const listMatch = lowerPrompt.match(listMembersPattern);
        if (listMatch) {
            return {
                action: 'list_group_members',
                entities: {
                    groupName: listMatch[1].trim()
                }
            };
        }

        return null;
    }

    /**
     * Find a user by name (fuzzy search)
     */
    static async findUserByName(name: string): Promise<{ user_id: string; user_name: string; email: string } | null> {
        const { data, error } = await supabase
            .from('users')
            .select('user_id, user_name, email')
            .ilike('user_name', `%${name}%`);

        if (error || !data || data.length === 0) {
            return null;
        }

        // Return exact match if exists, otherwise first fuzzy match
        const exactMatch = data.find(u => u.user_name.toLowerCase() === name.toLowerCase());
        return exactMatch || data[0];
    }

    /**
     * Find a group by name (fuzzy search)
     */
    static async findGroupByName(name: string): Promise<{ group_id: string; name: string; user_id: string } | null> {
        const { data, error } = await supabase
            .from('groups')
            .select('group_id, name, user_id')
            .ilike('name', `%${name}%`);

        if (error || !data || data.length === 0) {
            return null;
        }

        // Return exact match if exists, otherwise first fuzzy match
        const exactMatch = data.find(g => g.name.toLowerCase() === name.toLowerCase());
        return exactMatch || data[0];
    }

    /**
     * Find a task by title
     */
    static async findTaskByTitle(title: string, userId?: string): Promise<{ task_id: string; title: string; status: string } | null> {
        let query = supabase
            .from('tasks')
            .select('task_id, title, status')
            .ilike('title', `%${title}%`);

        if (userId) {
            query = query.eq('user_id', userId);
        }

        const { data, error } = await query;

        if (error || !data || data.length === 0) {
            return null;
        }

        const exactMatch = data.find(t => t.title.toLowerCase() === title.toLowerCase());
        return exactMatch || data[0];
    }

    /**
     * Add a member to a group
     */
    static async addMemberToGroup(
        requesterId: string,
        entities: { userName?: string; groupName?: string }
    ): Promise<AutomationResult> {
        if (!entities.userName || !entities.groupName) {
            return {
                success: false,
                message: "Please specify both the user name and group name."
            };
        }

        // Find the user
        const user = await this.findUserByName(entities.userName);
        if (!user) {
            return {
                success: false,
                message: `Could not find a user named "${entities.userName}". Please check the name and try again.`
            };
        }

        // Find the group
        const group = await this.findGroupByName(entities.groupName);
        if (!group) {
            return {
                success: false,
                message: `Could not find a group named "${entities.groupName}". Please check the name and try again.`
            };
        }

        // Check if user is already a member
        const { data: existingMember } = await supabase
            .from('group_members')
            .select('*')
            .eq('group_id', group.group_id)
            .eq('user_id', user.user_id)
            .single();

        if (existingMember) {
            return {
                success: false,
                message: `${user.user_name} is already a member of ${group.name}.`
            };
        }

        // Add the member
        try {
            await GroupService.addMember(group.group_id, user.user_id, 'member');
            
            return {
                success: true,
                message: `✅ Successfully added ${user.user_name} to the ${group.name} group!`,
                action: 'add_member_to_group',
                details: {
                    user: { id: user.user_id, name: user.user_name },
                    group: { id: group.group_id, name: group.name }
                }
            };
        } catch (error: any) {
            return {
                success: false,
                message: `Failed to add member: ${error.message}`
            };
        }
    }

    /**
     * Remove a member from a group
     */
    static async removeMemberFromGroup(
        requesterId: string,
        entities: { userName?: string; groupName?: string }
    ): Promise<AutomationResult> {
        if (!entities.userName || !entities.groupName) {
            return {
                success: false,
                message: "Please specify both the user name and group name."
            };
        }

        // Find the user
        const user = await this.findUserByName(entities.userName);
        if (!user) {
            return {
                success: false,
                message: `Could not find a user named "${entities.userName}".`
            };
        }

        // Find the group
        const group = await this.findGroupByName(entities.groupName);
        if (!group) {
            return {
                success: false,
                message: `Could not find a group named "${entities.groupName}".`
            };
        }

        // Remove the member
        const { error } = await supabase
            .from('group_members')
            .delete()
            .eq('group_id', group.group_id)
            .eq('user_id', user.user_id);

        if (error) {
            return {
                success: false,
                message: `Failed to remove member: ${error.message}`
            };
        }

        return {
            success: true,
            message: `✅ Successfully removed ${user.user_name} from the ${group.name} group.`,
            action: 'remove_member_from_group',
            details: {
                user: { id: user.user_id, name: user.user_name },
                group: { id: group.group_id, name: group.name }
            }
        };
    }

    /**
     * Create a new task
     */
    static async createTask(
        userId: string,
        entities: { taskTitle?: string; taskDescription?: string; dueDate?: string; priority?: string }
    ): Promise<AutomationResult> {
        if (!entities.taskTitle) {
            return {
                success: false,
                message: "Please specify a task title."
            };
        }

        try {
            // Parse due date if provided
            let dueDate: Date | undefined;
            if (entities.dueDate) {
                const dateStr = entities.dueDate.toLowerCase();
                const today = new Date();
                
                if (dateStr.includes('tomorrow')) {
                    dueDate = new Date(today);
                    dueDate.setDate(dueDate.getDate() + 1);
                } else if (dateStr.includes('next week')) {
                    dueDate = new Date(today);
                    dueDate.setDate(dueDate.getDate() + 7);
                } else if (dateStr.includes('today')) {
                    dueDate = today;
                } else {
                    // Try to parse as date
                    const parsed = new Date(dateStr);
                    if (!isNaN(parsed.getTime())) {
                        dueDate = parsed;
                    }
                }
            }

            const task = await TaskService.createTask({
                title: entities.taskTitle,
                description: entities.taskDescription,
                due_date: dueDate?.toISOString(),
                priority: (entities.priority as 'low' | 'medium' | 'high') || 'medium',
                status: 'todo',
                user_id: userId,
                created_by: userId
            });

            return {
                success: true,
                message: `✅ Created task: "${task.title}"${dueDate ? ` (due: ${dueDate.toLocaleDateString()})` : ''}`,
                action: 'create_task',
                details: task
            };
        } catch (error: any) {
            return {
                success: false,
                message: `Failed to create task: ${error.message}`
            };
        }
    }

    /**
     * Update task status
     */
    static async updateTaskStatus(
        userId: string,
        entities: { taskTitle?: string; status?: string }
    ): Promise<AutomationResult> {
        if (!entities.taskTitle || !entities.status) {
            return {
                success: false,
                message: "Please specify both the task name and the new status."
            };
        }

        // Find the task
        const task = await this.findTaskByTitle(entities.taskTitle, userId);
        if (!task) {
            return {
                success: false,
                message: `Could not find a task named "${entities.taskTitle}".`
            };
        }

        try {
            const updatedTask = await TaskService.updateTask(task.task_id, {
                status: entities.status as 'todo' | 'in_progress' | 'done'
            });

            return {
                success: true,
                message: `✅ Updated task "${task.title}" status to ${entities.status}.`,
                action: 'update_task_status',
                details: updatedTask
            };
        } catch (error: any) {
            return {
                success: false,
                message: `Failed to update task: ${error.message}`
            };
        }
    }

    /**
     * Create a new group
     */
    static async createGroup(
        userId: string,
        entities: { groupName?: string }
    ): Promise<AutomationResult> {
        if (!entities.groupName) {
            return {
                success: false,
                message: "Please specify a group name."
            };
        }

        try {
            const group = await GroupService.createGroup(entities.groupName, userId);

            return {
                success: true,
                message: `✅ Created group: "${group.name}"`,
                action: 'create_group',
                details: group
            };
        } catch (error: any) {
            return {
                success: false,
                message: `Failed to create group: ${error.message}`
            };
        }
    }

    /**
     * List members of a group
     */
    static async listGroupMembers(
        userId: string,
        entities: { groupName?: string }
    ): Promise<AutomationResult> {
        if (!entities.groupName) {
            return {
                success: false,
                message: "Please specify a group name."
            };
        }

        // Find the group
        const group = await this.findGroupByName(entities.groupName);
        if (!group) {
            return {
                success: false,
                message: `Could not find a group named "${entities.groupName}".`
            };
        }

        // Get members with user details
        const { data: members, error } = await supabase
            .from('group_members')
            .select(`
                role,
                joined_at,
                users (
                    user_id,
                    user_name,
                    email
                )
            `)
            .eq('group_id', group.group_id);

        if (error) {
            return {
                success: false,
                message: `Failed to fetch members: ${error.message}`
            };
        }

        if (!members || members.length === 0) {
            return {
                success: true,
                message: `The group "${group.name}" has no members yet.`,
                action: 'list_group_members',
                details: { group: group.name, members: [] }
            };
        }

        const memberList = members.map((m: any) => 
            `• ${m.users?.user_name || 'Unknown'} (${m.role})`
        ).join('\n');

        return {
            success: true,
            message: `Members of "${group.name}":\n${memberList}`,
            action: 'list_group_members',
            details: { group: group.name, members }
        };
    }
}
