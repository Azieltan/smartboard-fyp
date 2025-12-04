import { N8NService } from './n8n';

export class SmartyService {
    static async automate(userId: string, prompt: string) {
        // In a real scenario, we might parse the prompt to decide which workflow to trigger.
        // For now, we'll trigger a generic 'smarty-automation' workflow.
        try {
            return await N8NService.triggerWebhook('smarty-automation', {
                userId,
                prompt,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.warn('N8N webhook failed (expected if n8n is not running). Returning mock success.');
            return { message: "Automation started! (Mocked: n8n not reachable)" };
        }
    }

    static async ask(userId: string, question: string) {
        // Mock RAG response
        // In the future, this would connect to a vector DB and LLM.

        const mockFAQs: Record<string, string> = {
            "how to add member": "To add a member, go to the Group page, click 'Add Member', and select the user you want to add.",
            "how to create task": "Click the '+' button in the task list or drag on the calendar to create a new task.",
            "what is smarty": "I am Smarty, your AI assistant here to help you automate tasks and answer questions!"
        };

        // Simple keyword matching for mock responses
        const lowerQuestion = question.toLowerCase();
        for (const [key, answer] of Object.entries(mockFAQs)) {
            if (lowerQuestion.includes(key)) {
                return { answer };
            }
        }

        return {
            answer: "I'm not sure about that yet, but I'm learning! Try asking about adding members or creating tasks."
        };
    }
}
