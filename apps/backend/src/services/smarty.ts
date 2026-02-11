import { N8NService } from './n8n';

export class SmartyService {
    /**
     * Process automation commands like "Add John to the Marketing group"
     * This sends the command to n8n which connects to Supabase to perform actions
     */
    static async automate(userId: string, prompt: string) {


        try {
            // Send to n8n webhook for processing
            const result = await N8NService.triggerWebhook('smarty-automate', {
                userId,
                prompt,
                timestamp: new Date().toISOString()
            });

            return result;
        } catch (error: any) {
            console.error('[Smarty] Automation error:', error);
            return {
                success: false,
                message: `Failed to process automation: ${error.message}`
            };
        }
    }

    /**
     * Answer questions about using SmartBoard
     */
    static async ask(userId: string, question: string) {
        // Enhanced FAQ responses
        const mockFAQs: Record<string, string> = {
            "how to add member": "To add a member, go to the Group page, click 'Add Member', and select the user you want to add. Or use 'Let Smarty Do' and say 'Add [name] to [group]'!",
            "how to create task": "Click the '+' button in the task list or drag on the calendar to create a new task. Or use 'Let Smarty Do' and say 'Create a task called [title]'!",
            "what is smarty": "I am Smarty, your AI assistant! I can automate tasks like adding members to groups, creating tasks, and more. Try 'Let Smarty Do' for automations!",
            "what can you do": "I can help you:\n• Add/remove members from groups\n• Create and update tasks\n• Create new groups\n• List group members\n\nJust tell me what you need!",
            "how to remove member": "Use 'Let Smarty Do' and say 'Remove [name] from [group]' to remove a member.",
            "how to create group": "Go to the Groups page and click 'Create Group'. Or use 'Let Smarty Do' and say 'Create group called [name]'!",
            "how to add friend": "Click the 'Add Friend' button on your dashboard. You can search for friends by their Email or User ID!",
            "pending friend": "Check the 'Friends' list on the side of your dashboard. Any requests Sent to you will appear there with an 'Accept' button.",
            "join group": "To join a group, click the 'Join' icon in the Groups widget and enter the 6-character Join Code shared by the owner.",
            "share calendar": "Events you create can be shared with entire groups or specific friends. In the 'Add Event' window, just select 'Group' or 'Friend' in the 'Who is this for?' section.",
            "where are my friends": "Your friends and pending requests are listed in the 'Friends' widget on the right side of your dashboard!"
        };

        // Simple keyword matching for responses
        const lowerQuestion = question.toLowerCase();
        for (const [key, answer] of Object.entries(mockFAQs)) {
            if (lowerQuestion.includes(key)) {
                return { answer };
            }
        }

        return {
            answer: "I'm not sure about that yet, but I'm learning! Try asking about:\n• How to add/remove members\n• How to create tasks or groups\n• What I can do"
        };
    }
}
