import { Router } from 'express';
import { AutomationService } from '../services/automationService';
import { SmartyService } from '../services/smarty';
import {
  AutomationRequestSchema,
  AutomationConfirmSchema
} from '../schemas/automationSchemas';
import { authMiddleware } from '../middleware/auth';
import { CalendarService } from '../services/calendar';
import { TaskService } from '../services/task';
import { supabase } from '../lib/supabase';

const router = Router();

/**
 * Public Smarty routes
 */

// Natural language automation initiation
router.post('/automate', authMiddleware, async (req: any, res) => {
  try {
    const validated = AutomationRequestSchema.parse(req.body);
    const userId = req.user.userId;

    const result = await AutomationService.initiateAutomation(userId, validated);
    res.json(result);
  } catch (error: any) {
    console.error('[SmartyRoute] /automate error:', error);
    res.status(error.name === 'ZodError' ? 400 : 500).json({
      error: error.message || 'Internal Server Error'
    });
  }
});

// Confirmation logic
router.post('/automate/confirm', authMiddleware, async (req: any, res) => {
  try {
    const { automation_id } = AutomationConfirmSchema.parse(req.body);
    const userId = req.user.userId;

    const result = await AutomationService.confirmAutomation(userId, automation_id);
    res.json(result);
  } catch (error: any) {
    console.error('[SmartyRoute] /confirm error:', error);
    res.status(error.name === 'ZodError' ? 400 : 500).json({
      error: error.message || 'Internal Server Error'
    });
  }
});

// Legacy Ask route (FAQ)
router.post('/ask', async (req, res) => {
  try {
    const { userId, question } = req.body;
    const result = await SmartyService.ask(userId, question);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to process question' });
  }
});

/**
 * Internal execution endpoint (Handshake with n8n)
 * Secure this with a secret key in production
 */
router.post('/internal/execute', async (req, res) => {
  const { automation_id, payload, secret } = req.body;

  if (secret !== process.env.INTERNAL_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const { action, data } = payload;
    let result;

    switch (action) {
      case 'create_calendar_event':
        result = await CalendarService.createEvent(data);
        break;
      case 'create_task':
        result = await TaskService.createTask(data);
        break;
      case 'mark_task_done':
        result = await TaskService.updateTask(data.task_id, { status: 'done' });
        break;
      // Add other allowlist actions here
      default:
        throw new Error(`Action ${action} not implemented`);
    }

    res.json({ success: true, result });
  } catch (error: any) {
    console.error('[InternalRoute] Execution error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
