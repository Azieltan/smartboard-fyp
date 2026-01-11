import { z } from 'zod';

const statuses = ['pending', 'confirmed', 'executing', 'done', 'failed'] as const;
export const AutomationStatus = z.enum(statuses);

export const AutomationRequestSchema = z.object({
  rawText: z.string().min(1),
  context: z.record(z.string(), z.any()).optional().default({}),
});

export const AutomationConfirmSchema = z.object({
  automation_id: z.string().uuid(),
});

const allowedActions = [
  'create_calendar_event',
  'create_reminder',
  'create_task',
  'assign_task',
  'mark_task_done',
  'reschedule_event',
  'send_group_message'
] as const;

export const AutomationPayloadSchema = z.object({
  action: z.enum(allowedActions),
  data: z.record(z.string(), z.any()),
});

export type AutomationStatus = z.infer<typeof AutomationStatus>;
export type AutomationRequest = z.infer<typeof AutomationRequestSchema>;
export type AutomationConfirm = z.infer<typeof AutomationConfirmSchema>;
export type AutomationPayload = z.infer<typeof AutomationPayloadSchema>;

export interface AutomationResult {
  automation_id: string;
  needs_confirmation: boolean;
  summary: string;
  payload?: AutomationPayload;
  error?: string;
}
