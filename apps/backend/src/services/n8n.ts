import axios from 'axios';

/**
 * Service to interact with N8N workflows via Webhooks.
 */
export const N8NService = {
    /**
     * Triggers a generic N8N webhook.
     * @param webhookPath The path of the webhook (e.g., 'my-workflow').
     * @param data The payload to send to N8N.
     */
    async triggerWebhook(webhookPath: string, data: any) {
        const n8nBaseUrl = process.env.N8N_BASE_URL || 'http://localhost:5678/webhook';
        const url = `${n8nBaseUrl}/${webhookPath}`;

        try {
            console.log(`[N8N] Triggering webhook: ${url}`);
            const response = await axios.post(url, data);
            console.log(`[N8N] Success:`, response.data);
            return response.data;
        } catch (error) {
            console.error(`[N8N] Error triggering webhook:`, error);
            throw error;
        }
    },

    /**
     * Example: Trigger a reminder workflow.
     */
    async triggerReminder(userId: string, taskId: string, message: string) {
        return this.triggerWebhook('send-reminder', {
            userId,
            taskId,
            message,
            timestamp: new Date().toISOString()
        });
    }
};
