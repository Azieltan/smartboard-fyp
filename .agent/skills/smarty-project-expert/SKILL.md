---
name: smarty-project-expert
description: Deep context for the SmartBoard FYP project. Use this when the agent needs to understand the project architecture, service locations, database schema, or how to interact with the n8n automation layer.
---

# SmartBoard Project Expert

## Project Overview
SmartBoard is a collaborative task and project management application with an integrated AI assistant (Smarty) and automation features.

## Core Architecture

### Frontend (Next.js)
- **Path**: `apps/frontend/src/`
- **Key Components**:
  - `SmartyBubble.tsx`: The main AI assistant interface.
  - `Chat.tsx`: Real-time messaging component.
  - `Dashboard/admin/page.tsx`: System administrator controls.

### Backend (Express)
- **Path**: `apps/backend/src/`
- **Key Services**:
  - `NotificationService.ts`: Handles core app notifications (DB + Socket).
  - `AutomationService.ts`: Routes commands from AI to specific execution logic.
  - `TaskService.ts` / `GroupService.ts`: Standard CRUD for core entities.

## Database Schema (Supabase)
Key tables include:
- `users`: Profile and role information.
- `tasks`: Core task data including `reminder_sent`.
- `groups`: Collaborative spaces for users.
- `notifications`: Application-level alerts.

## Automation & AI (n8n)
- **Flow**: User → `SmartyBubble` → Backend `/automate` → n8n Webhook → AI (DeepSeek) → Backend `/execute` → DB.
- **n8n Webhook URL**: Found in `apps/frontend/src/components/SmartyBubble.tsx`.

## Critical Guidelines
- **Minimalism**: Prefer small, incremental changes over large refactors.
- **Safety**: Keep `service_role` keys on the backend only.
- **Rules**: Always reference `AI_AGENT_IMPLEMENTATION_PLAN.md` for any feature work.
