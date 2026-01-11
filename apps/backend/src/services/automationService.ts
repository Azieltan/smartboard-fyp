import axios from 'axios';
import { supabase } from '../lib/supabase';
import {
  AutomationRequest,
  AutomationResult,
  AutomationStatus,
  AutomationPayload
} from '../schemas/automationSchemas';
import { v4 as uuidv4 } from 'uuid';

export class AutomationService {
  private static N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL || 'https://n8n.h5preact.app/webhook/smarty-automate';
  private static N8N_SECRET = process.env.N8N_SECRET || '';

  /**
   * Initiate automation from natural language
   */
  static async initiateAutomation(userId: string, request: AutomationRequest): Promise<AutomationResult> {
    const automation_id = uuidv4();

    // 1. Store initial request in DB
    const { error: dbError } = await supabase
      .from('automation_requests')
      .insert({
        automation_id,
        user_id: userId,
        raw_text: request.rawText,
        status: 'pending'
      });

    if (dbError) {
      console.error('[AutomationService] DB Error:', dbError);
      throw new Error('Failed to create automation record');
    }

    try {
      // 2. Call n8n to parse intent
      const response = await this.callN8N(automation_id, userId, request.rawText, request.context);

      const result: AutomationResult = {
        automation_id,
        needs_confirmation: response.needs_confirmation ?? true,
        summary: response.summary || 'I understood your request. Should I proceed?',
        payload: response.payload
      };

      // 3. Update record with summary and payload
      await supabase
        .from('automation_requests')
        .update({
          summary: result.summary,
          payload: result.payload,
          updated_at: new Date()
        })
        .eq('automation_id', automation_id);

      return result;
    } catch (error: any) {
      console.error('[AutomationService] n8n Error:', error.message);

      await supabase
        .from('automation_requests')
        .update({
          status: 'failed',
          updated_at: new Date()
        })
        .eq('automation_id', automation_id);

      throw new Error(error.message || 'n8n processing failed');
    }
  }

  /**
   * Confirm and execute automation
   */
  static async confirmAutomation(userId: string, automation_id: string): Promise<any> {
    // 1. Validate request
    const { data: request, error: fetchError } = await supabase
      .from('automation_requests')
      .select('*')
      .eq('automation_id', automation_id)
      .eq('user_id', userId)
      .single();

    if (fetchError || !request) {
      throw new Error('Automation request not found');
    }

    if (request.status !== 'pending') {
      throw new Error(`Automation is already ${request.status}`);
    }

    // 2. Update status to executing
    await supabase
      .from('automation_requests')
      .update({ status: 'executing', updated_at: new Date() })
      .eq('automation_id', automation_id);

    try {
      // 3. Trigger n8n execution phase
      // In this flow, we call n8n with the confirm action
      const response = await axios.post(this.N8N_WEBHOOK_URL, {
        action: 'confirm',
        automation_id,
        user_id: userId,
        payload: request.payload
      }, {
        headers: { 'X-n8n-Secret': this.N8N_SECRET }
      });

      // 4. Record completion (or wait for n8n to call /internal/automation/execute)
      // For MVP simplicity, we assume n8n returns success after calling the internal API
      await supabase
        .from('automation_requests')
        .update({ status: 'done', updated_at: new Date() })
        .eq('automation_id', automation_id);

      return {
        success: true,
        message: 'Action completed successfully',
        result: response.data
      };
    } catch (error: any) {
      await supabase
        .from('automation_requests')
        .update({ status: 'failed', updated_at: new Date() })
        .eq('automation_id', automation_id);

      throw new Error(error.message || 'Execution failed');
    }
  }

  /**
   * Internal helper to call n8n
   */
  private static async callN8N(automation_id: string, user_id: string, rawText: string, context: any) {
    let retries = 2;
    let delay = 1000;

    while (retries >= 0) {
      try {
        const response = await axios.post(this.N8N_WEBHOOK_URL, {
          action: 'initiate',
          automation_id,
          user_id,
          rawText,
          timezone: context.timezone || 'UTC',
          context
        }, {
          headers: { 'X-n8n-Secret': this.N8N_SECRET },
          timeout: 10000 // 10s timeout
        });

        return response.data;
      } catch (error: any) {
        if (retries === 0) throw error;
        console.warn(`[AutomationService] Retrying n8n call... (${retries} left)`);
        await new Promise(resolve => setTimeout(resolve, delay));
        retries--;
        delay *= 2; // Exponential backoff
      }
    }
  }
}
