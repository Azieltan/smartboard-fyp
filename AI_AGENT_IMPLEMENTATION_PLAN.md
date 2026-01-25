# SmartBoard Enhancement Implementation Plan

> **Purpose**: Step-by-step guide for AI agent to implement features without hallucination.
> **Created**: December 26, 2025
> **Project Path**: `c:\Users\aziel\fyp-project`

---

## 📋 Table of Contents

1. [Project Structure Overview](#1-project-structure-overview)
2. [Task 1: Notification System](#2-task-1-notification-system-pop-out-notifications)
3. [Task 2: Remove User Online State](#3-task-2-remove-user-online-state)
4. [Task 3: Fix Chat Background UI](#4-task-3-fix-chat-background-ui)
5. [Task 5: Draggable AI Bubble with Options](#5-task-5-draggable-ai-bubble-with-options)
   - [Task 5 (Phase 2 & 3): n8n Orchestration & "Let Smarty Do"](#task-5-phase-2--3-n8n-orchestration--let-smarty-do)
6. [Task 6: Group Enhancements](#6-task-6-group-enhancements)
7. [Task 7: User Enhancements](#7-task-7-user-enhancements)
8. [Task 8: Dashboard UI Implementation](#8-task-8-dashboard-ui-implementation)
9. [Task Logic Behind Tasks](#9-task-logic-behind-tasks-ownerassigneeadmin)
10. [Full Function Double-Check Checklist](#11-full-function-double-check-checklist-before-demo--merge)
11. [Task 9: Advanced Authentication](#11-task-9-advanced-authentication)
12. [Optional Add-ons (Post-MVP)](#12-optional-add-ons-post-mvp)

---

## 1. Project Structure Overview

### Frontend (Next.js + TypeScript)

```
apps/frontend/src/
├── app/
│   ├── globals.css              # Global styles, animations
│   ├── layout.tsx               # Root layout with SmartyBubble
│   ├── page.tsx                 # Landing page
│   ├── admin/                   # System Owner admin page (route: /admin)
│   ├── dashboard/
│   │   ├── layout.tsx           # Dashboard layout with Sidebar
│   │   ├── page.tsx             # Main dashboard
│   │   ├── chat/page.tsx        # Chat page (334 lines)
│   │   ├── calendar/
│   │   ├── settings/
│   │   └── tasks/
│   ├── login/
│   └── register/
├── components/
│   ├── AddFriendModal.tsx
│   ├── AddMemberModal.tsx
│   ├── CalendarWidget.tsx
│   ├── Chat.tsx                 # Main chat component (357 lines)
│   ├── CreateEventModal.tsx
│   ├── CreateGroupModal.tsx
│   ├── CreateTaskModal.tsx
│   ├── FAQWidget.tsx
│   ├── FileUpload.tsx
│   ├── FriendList.tsx           # Friend list (126 lines)
│   ├── GroupDetailView.tsx      # Group detail (412 lines)
│   ├── GroupList.tsx            # Group list (293 lines)
│   ├── JoinGroupModal.tsx
│   ├── Sidebar.tsx              # Navigation sidebar (159 lines)
│   ├── SmartyBubble.tsx         # AI assistant bubble (166 lines)
│   ├── TaskAssignment.tsx
│   └── TimeSelector.tsx
├── lib/
│   ├── api.ts
│   └── socket.ts
│   └── supabase.ts              # Supabase client (frontend)
└── config/
    └── faq.ts
```

### Backend (Express + TypeScript)

```
apps/backend/src/
├── index.ts                     # Main server (513 lines)
├── lib/
│   └── supabase.ts
├── middleware/
│   └── auth.ts
└── services/
    ├── auth.ts
    ├── automation.ts
    ├── calendar.ts
    ├── chat.ts
    ├── friend.ts                # Friend service (95 lines)
    ├── group.ts                 # Group service (404 lines)
    ├── n8n.ts
    ├── smarty.ts
    └── task.ts                  # Task service (128 lines)
```

### Supabase (Where It Is / What It Does)

You **do use Supabase** in this project:

- Backend: `apps/backend/src/lib/supabase.ts`
  - Uses **service role key** for server-side DB/admin operations
  - Uses a separate `supabaseAuth` client for password sign-in flows
- Frontend: `apps/frontend/src/lib/supabase.ts`
  - Uses `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Supabase responsibilities in this app:

- Postgres database (tables like users, groups, tasks, etc.)
- Auth (email/password)
- Storage (uploads) where needed

### Key Existing Patterns

- **API calls**: Use `api.get()`, `api.post()`, `api.put()`, `api.delete()` from `lib/api.ts`
- **Socket.io**: Import from `lib/socket.ts`, use `socket.emit()`, `socket.on()`
- **Styling**: Tailwind CSS with custom utilities in `globals.css`
- **Glass morphism**: Use `glass-panel` class
- **Gradients**: Use `bg-gradient-to-*` or predefined gradients

---

### MVP Minimal & Safe Baseline (Do This Before Demo)

This codebase is **reasonably minimal for an MVP**, but it is **not fully secure** yet (mainly because frontend pages rely on `localStorage` and some routes are not strictly protected).

Minimum safety baseline to meet “minimal and safe”:

- **Secrets**: Set `JWT_SECRET` in backend env (do not use the default fallback).
- **Auth**: Ensure protected backend routes use `authMiddleware` and derive user identity from JWT, not from client-provided `userId`.
- **Admin**: `/admin` must be owner-only with backend-enforced checks (frontend hiding is not security).
- **Supabase keys**: Never expose `SUPABASE_SERVICE_KEY` to frontend.
- **RLS**: If you ever access tables directly from frontend Supabase client, enable RLS and policies. If all data access is via backend, keep service-key usage strictly server-side.
- **API consistency**: Prefer using `apps/frontend/src/lib/api.ts` with `NEXT_PUBLIC_API_URL` (avoid hardcoded `http://localhost:3001` in pages).

## 2. Task 1: Notification System (Pop-out Notifications)

### ⚠️ IMPORTANT: DO NOT modify Chat.tsx logic

### MVP-first Guidance (n8n vs Traditional)

**Decision**: Implement core notifications in traditional backend code first (DB + API + Socket emit). Use n8n only as an optional add-on layer later.

**Why**:

- Keeps the app runnable even if n8n/webhooks are down
- Ensures notifications are consistent and auditable in the database
- Lets n8n focus on “automation extras” (digests, reminders, integrations)

**Rule**:

- **Core product notifications must be generated by the backend** (`NotificationService.createNotification`) and stored in `notifications` table.
- **n8n may be triggered after** a notification is created (webhook/event) for non-critical flows.

### Goal

Create WhatsApp-style pop-out notifications in the chat sidebar for:

- Friend requests (received)
- Group invitations/additions
- New chat messages (when not in that chat)

### Add-on: Pop-out Message (More Obvious Than Red Dot)

Problem today: when receiving messages, users may only notice the **red dot** on the notification bell, which is not obvious enough.

Requirement:

- Show a **pop-out notification popup** when receiving a new notification (especially new messages)
- Popup includes a **Cancel (X)** button
- If user does nothing, popup **auto disappears after 3 seconds**

This pop-out is implemented via `NotificationPopup` + `NotificationManager` (do not add a separate system).

### Implementation Steps

#### Step 1.1: Create Notification Types (Frontend)

**File**: `apps/frontend/src/types/notification.ts` (NEW FILE)

```typescript
export interface Notification {
  id: string;
  type: "friend_request" | "group_invite" | "chat_message" | "task_assigned";
  title: string;
  message: string;
  sender_id?: string;
  sender_name?: string;
  group_id?: string;
  chat_id?: string;
  is_read: boolean;
  created_at: string;
  action_url?: string;
}
```

#### Step 1.2: Create NotificationService (Backend)

**File**: `apps/backend/src/services/notification.ts` (NEW FILE)

Must implement:

- `createNotification(userId, type, data)` - Create new notification
- `getUnreadNotifications(userId)` - Get unread notifications
- `markAsRead(notificationId)` - Mark single as read
- `markAllAsRead(userId)` - Mark all as read

Database table needed (run migration):

```sql
CREATE TABLE IF NOT EXISTS notifications (
    notification_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(user_id),
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT,
    sender_id UUID REFERENCES users(user_id),
    group_id UUID REFERENCES groups(group_id),
    chat_id UUID REFERENCES chats(chat_id),
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    action_url VARCHAR(500)
);
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_unread ON notifications(user_id, is_read);
```

#### Step 1.3: Add Notification Endpoints (Backend)

**File**: `apps/backend/src/index.ts`

Add after existing routes (around line 140):

```typescript
// Notification Routes
import { NotificationService } from './services/notification';

app.get('/notifications/:userId', async (req, res) => { ... });
app.put('/notifications/:notificationId/read', async (req, res) => { ... });
app.put('/notifications/:userId/read-all', async (req, res) => { ... });
```

#### Step 1.4: Integrate Notifications into Friend Service

**File**: `apps/backend/src/services/friend.ts`

In `addFriend()` method (around line 37), after successful insert:

```typescript
// Send notification to recipient
await NotificationService.createNotification(targetFriendId, "friend_request", {
  title: "New Friend Request",
  message: `${senderName} sent you a friend request`,
  sender_id: userId,
});
```

#### Step 1.5: Create NotificationPopup Component (Frontend)

**File**: `apps/frontend/src/components/NotificationPopup.tsx` (NEW FILE)

Design specs:

- Position: Fixed, top-right corner of chat sidebar
- Animation: Slide in from right, fade out after 3 seconds
- Style: Glass morphism with colored left border based on type
- Actions:
  - Click to navigate
  - Cancel (X) button to dismiss immediately

```typescript
interface NotificationPopupProps {
  notification: Notification;
  onDismiss: () => void;
  onAction: () => void;
}
```

#### Step 1.6: Create NotificationManager Component (Frontend)

**File**: `apps/frontend/src/components/NotificationManager.tsx` (NEW FILE)

Responsibilities:

- Listen to socket events for new notifications
- Manage queue of visible notifications (max 3)
- Auto-dismiss after **3 seconds**
- Stack notifications vertically

Additional requirements (Notification bell optimization):

- The **red dot** on the notification bell should disappear after the user **views** notifications (opens the panel).
- Notifications/messages shown inside the notification bell panel must be **closable** (dismiss/remove from list).

Socket events to listen:

- `notification:new` - New notification received
- `notification:friend_request` - Friend request specific
- `notification:group_invite` - Group invite specific

#### Step 1.7: Add NotificationManager to Chat Page

**File**: `apps/frontend/src/app/dashboard/chat/page.tsx`

Add import and render NotificationManager inside the chat layout (line ~145):

```tsx
import NotificationManager from "../../../components/NotificationManager";
// ...
return (
  <div className="flex h-screen...">
    <NotificationManager userId={userId} />
    {/* existing content */}
  </div>
);
```

#### Step 1.8: Backend Socket Emit for Notifications

**File**: `apps/backend/src/index.ts`

Add to socket handler and NotificationService:

```typescript
// In NotificationService.createNotification():
io.to(userId).emit("notification:new", notification);
```

### Testing Checklist

- [ ] Send friend request → Recipient sees notification popup
- [ ] Add user to group → User sees notification popup
- [ ] New message in non-active chat → User sees notification popup
- [ ] Click notification → Navigate to relevant page
- [ ] Popup has Cancel (X) and closes immediately
- [ ] Notification auto-dismisses after 3 seconds
- [ ] Multiple notifications stack properly
- [ ] Red dot disappears after viewing notifications
- [ ] Notifications can be closed in the notification bell list

---

### Optional (Later): n8n Automation Hooks

Only after the traditional notification system is stable:

- Add a lightweight trigger from backend when creating notifications (example: POST to n8n webhook)
- Use n8n for:
  - Daily/weekly digest notifications
  - Reminder schedules (tasks due soon)
  - Third-party integrations (email/WhatsApp/Telegram)

---

## 3. Task 2: Remove User Online State

### Goal

Remove the online/offline status indicator from:

1. Chat header
2. Chat conversation list
3. DM items

### Implementation Steps

#### Step 2.1: Update Chat.tsx Header

**File**: `apps/frontend/src/components/Chat.tsx`

Find line ~215 and REMOVE:

```tsx
<p className="text-[10px] text-emerald-400 font-medium">Online</p>
```

Replace the entire header div content with just the title (remove online status).

#### Step 2.2: Update Chat Page Conversation List

**File**: `apps/frontend/src/app/dashboard/chat/page.tsx`

1. Remove `status` from Conversation interface (line ~14)
2. Remove the green dot indicator for DMs (around line ~255-260):

```tsx
{
  conv.type === "dm" && (
    <div
      className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-[#0f172a] bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]`}
    />
  );
}
```

DELETE this entire block.

3. Remove `status: 'online'` from friend mapping (around line ~80):

```tsx
// CHANGE FROM:
.map((f: any) => ({
    id: f.friend_details.user_id,
    name: f.friend_details.user_name || f.friend_details.username || 'User',
    type: 'dm',
    status: 'online'  // REMOVE THIS LINE
}));
```

#### Step 2.3: Update SmartyBubble.tsx Header (Optional)

**File**: `apps/frontend/src/components/SmartyBubble.tsx`

Line ~91, change:

```tsx
<p className="text-[10px] text-blue-100 opacity-80">Online & Ready to help</p>
```

To:

```tsx
<p className="text-[10px] text-blue-100 opacity-80">Ready to help</p>
```

### Testing Checklist

- [ ] Chat header shows no online status
- [ ] DM conversations show no green dot
- [ ] Friend list shows no online status
- [ ] No console errors after changes

---

## 4. Task 3: Fix Chat Background UI

### Goal

Fix the chat background pattern that may not be displaying correctly.

### Current Issue

**File**: `apps/frontend/src/components/Chat.tsx` (line ~260)

Current code uses external image URL:

```tsx
bg -
  [
    url(
      "https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png"
    ),
  ];
```

### Implementation Steps

#### Step 3.1: Create Local Background Pattern

**File**: `apps/frontend/public/chat-pattern.svg` (NEW FILE)

Create a subtle chat pattern SVG or use a CSS pattern.

#### Step 3.2: Update Chat.tsx Background

**File**: `apps/frontend/src/components/Chat.tsx`

Replace line ~260 with a more reliable approach:

```tsx
<div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar relative">
  {/* Subtle pattern overlay */}
  <div className="absolute inset-0 opacity-[0.02] pointer-events-none">
    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-transparent to-violet-500/10"></div>
    {/* Optional: Add subtle dots pattern via CSS */}
  </div>
  {/* Messages content */}
  <div className="relative z-10">{/* existing message rendering */}</div>
</div>
```

#### Step 3.3: Add Chat Pattern to globals.css

**File**: `apps/frontend/src/app/globals.css`

Add after line ~100:

```css
.chat-bg-pattern {
  background-image: radial-gradient(
    circle at 1px 1px,
    rgba(255, 255, 255, 0.03) 1px,
    transparent 0
  );
  background-size: 24px 24px;
}
```

### Alternative Option (Keep WhatsApp style)

If you want to keep the WhatsApp-style pattern, download the image locally:

1. Save image to `apps/frontend/public/images/chat-bg.png`
2. Update reference to `/images/chat-bg.png`

### Testing Checklist

- [ ] Chat area shows subtle background pattern
- [ ] Pattern doesn't interfere with message readability
- [ ] Pattern works in both light and dark themes (future)
- [ ] No external image loading errors

---

## 5. Task 4: Light/Dark Mode (CANCELLED)

### Decision

This feature is **de-scoped/cancelled** ("too ugly"). Do **not** implement light/dark mode changes as part of this plan.

### Note

If theme support becomes required later, revisit with a proper design system and agreed color tokens.

---

## 6. Task 5: Draggable AI Bubble with Options

### Goal

1. Make AI bubble draggable anywhere on screen
2. Default position: bottom-right
3. Auto-hide to side after 10 seconds of inactivity
4. Click shows two options: "Ask Smarty AI" and "Let Smarty Do" (disabled)

### Implementation Steps

#### Step 6.1: Update SmartyBubble Component

**File**: `apps/frontend/src/components/SmartyBubble.tsx`

Replace entire component (166 lines):

```typescript
"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import axios from "axios";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface Position {
  x: number;
  y: number;
}

export function SmartyBubble() {
  // UI State
  const [showOptions, setShowOptions] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [isHidden, setIsHidden] = useState(false);

  // Position state
  const [position, setPosition] = useState<Position>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragOffset = useRef<Position>({ x: 0, y: 0 });

  // Chat state
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hi, I'm Smarty! Ask me anything about using SmartBoard.",
    },
  ]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);

  // Refs
  const bubbleRef = useRef<HTMLDivElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const hideTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastInteractionRef = useRef<number>(Date.now());

  const [user, setUser] = useState<{ uid: string }>({ uid: "" });

  // Initialize position
  useEffect(() => {
    setPosition({
      x: window.innerWidth - 80,
      y: window.innerHeight - 80,
    });
  }, []);

  // User setup
  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr && userStr !== "undefined") {
      try {
        const u = JSON.parse(userStr);
        setUser({ uid: u.user_id });
      } catch (e) {
        console.error("Failed to parse user from localStorage", e);
      }
    }
  }, []);

  // Auto-hide after 10 seconds of inactivity
  const resetHideTimer = useCallback(() => {
    lastInteractionRef.current = Date.now();
    setIsHidden(false);

    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
    }

    if (!showOptions && !showChat) {
      hideTimerRef.current = setTimeout(() => {
        const timeSinceInteraction = Date.now() - lastInteractionRef.current;
        if (timeSinceInteraction >= 10000) {
          setIsHidden(true);
        }
      }, 10000);
    }
  }, [showOptions, showChat]);

  useEffect(() => {
    resetHideTimer();
    return () => {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, [resetHideTimer]);

  // Dragging handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (showChat || showOptions) return;
    setIsDragging(true);
    dragOffset.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    };
    resetHideTimer();
  };

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging) return;

      const newX = Math.max(
        0,
        Math.min(window.innerWidth - 56, e.clientX - dragOffset.current.x)
      );
      const newY = Math.max(
        0,
        Math.min(window.innerHeight - 56, e.clientY - dragOffset.current.y)
      );

      setPosition({ x: newX, y: newY });
    },
    [isDragging]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Click outside handler
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        bubbleRef.current &&
        !bubbleRef.current.contains(event.target as Node)
      ) {
        setShowOptions(false);
        setShowChat(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Chat scroll
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, showChat]);

  const handleBubbleClick = () => {
    if (!isDragging) {
      resetHideTimer();
      setShowOptions(!showOptions);
      setShowChat(false);
    }
  };

  const handleAskSmarty = () => {
    setShowOptions(false);
    setShowChat(true);
    resetHideTimer();
  };

  const handleLetSmartyDo = () => {
    // Under development - do nothing
    alert("This feature is still under development. Coming soon!");
  };

  const handleAsk = async () => {
    if (!chatInput.trim()) return;

    const userMessage = chatInput.trim();
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setChatInput("");
    setChatLoading(true);

    try {
      const res = await axios.post(
        "https://n8n.h5preact.app/webhook/f66a2f4e-b415-4844-a6ef-e37c9eb072b9/chat",
        {
          action: "sendMessage",
          sessionId: user.uid,
          chatInput: userMessage,
        }
      );

      let answer = "I didn't get a response.";
      if (typeof res.data === "string") {
        answer = res.data;
      } else if (Array.isArray(res.data)) {
        answer = res.data
          .map((msg: any) => msg.text || JSON.stringify(msg))
          .join("\n");
      } else if (res.data.output) {
        answer = res.data.output;
      } else {
        answer = res.data.text || res.data.answer || JSON.stringify(res.data);
      }

      setMessages((prev) => [...prev, { role: "assistant", content: answer }]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, I'm having trouble connecting to Smarty right now.",
        },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  // Calculate hidden position (slide to edge)
  const getHiddenPosition = () => {
    const centerX = window.innerWidth / 2;
    if (position.x < centerX) {
      return { x: -40, y: position.y }; // Hide to left
    }
    return { x: window.innerWidth - 16, y: position.y }; // Hide to right
  };

  const displayPosition = isHidden ? getHiddenPosition() : position;

  return (
    <div
      ref={bubbleRef}
      className="fixed z-[100] transition-all duration-300"
      style={{
        left: displayPosition.x,
        top: displayPosition.y,
        cursor: isDragging ? "grabbing" : "grab",
        opacity: isHidden ? 0.3 : 1,
        transform: isHidden ? "scale(0.8)" : "scale(1)",
      }}
      onMouseEnter={() => isHidden && setIsHidden(false)}
    >
      {/* Options Menu */}
      {showOptions && !showChat && (
        <div className="absolute bottom-16 right-0 w-56 bg-[#1e293b] rounded-2xl shadow-2xl border border-white/10 overflow-hidden animate-in slide-in-from-bottom-2 fade-in duration-300">
          <button
            onClick={handleAskSmarty}
            className="w-full px-4 py-4 text-left text-sm hover:bg-white/10 flex items-center gap-3 transition-colors text-white group"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              💬
            </div>
            <div>
              <p className="font-semibold">Ask Smarty AI</p>
              <p className="text-xs text-slate-400">Get help with SmartBoard</p>
            </div>
          </button>
          <div className="h-px bg-white/10" />
          <button
            onClick={handleLetSmartyDo}
            className="w-full px-4 py-4 text-left text-sm flex items-center gap-3 transition-colors text-slate-400 cursor-not-allowed group opacity-60"
            disabled
          >
            <div className="w-10 h-10 rounded-xl bg-slate-700 flex items-center justify-center">
              🤖
            </div>
            <div>
              <p className="font-semibold">Let Smarty Do</p>
              <p className="text-xs text-slate-500">Coming Soon</p>
            </div>
            <span className="ml-auto px-2 py-0.5 bg-amber-500/20 text-amber-500 text-[10px] font-bold rounded-full">
              DEV
            </span>
          </button>
        </div>
      )}

      {/* Chat Window */}
      {showChat && (
        <div className="absolute bottom-16 right-0 w-80 sm:w-96 h-[500px] bg-[#1e293b] rounded-3xl shadow-2xl border border-white/10 overflow-hidden flex flex-col animate-in slide-in-from-bottom-5 fade-in duration-300">
          {/* Header */}
          <div className="p-4 bg-gradient-to-r from-blue-600 to-violet-600 text-white flex justify-between items-center shrink-0 shadow-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-xl">
                🤖
              </div>
              <div>
                <h3 className="font-bold text-sm">Smarty AI</h3>
                <p className="text-[10px] text-blue-100 opacity-80">
                  Ready to help
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowChat(false)}
              className="hover:bg-white/20 rounded-full p-2 transition-colors"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Chat Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-[#0f172a]/50">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${
                  msg.role === "user" ? "justify-end" : "justify-start"
                } animate-in slide-in-from-bottom-2 duration-300`}
              >
                <div
                  className={`max-w-[85%] p-3 rounded-2xl text-sm shadow-md ${
                    msg.role === "user"
                      ? "bg-blue-600 text-white rounded-br-none"
                      : "bg-[#1e293b] text-slate-100 rounded-tl-none border border-white/5"
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {chatLoading && (
              <div className="flex justify-start">
                <div className="bg-[#1e293b] border border-white/5 p-3 rounded-2xl rounded-tl-none flex gap-1">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" />
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce delay-150" />
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce delay-300" />
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 bg-[#1e293b] border-t border-white/5 shrink-0">
            <div className="relative flex items-center gap-2">
              <input
                type="text"
                className="flex-1 px-4 py-2.5 bg-[#0f172a] border border-white/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-white placeholder-slate-500 transition-all"
                placeholder="Ask Smarty..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAsk()}
                disabled={chatLoading}
              />
              <button
                onClick={handleAsk}
                disabled={!chatInput.trim() || chatLoading}
                className="w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center hover:bg-blue-500 disabled:opacity-50 transition-all shadow-lg shadow-blue-600/20"
              >
                <svg
                  className="w-5 h-5 rotate-90"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M2.01 21L23 12L2.01 3L2 10L17 12L2 14L2.01 21Z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Bubble Button */}
      <button
        onMouseDown={handleMouseDown}
        onClick={handleBubbleClick}
        className={`w-14 h-14 rounded-2xl shadow-2xl flex items-center justify-center transition-all duration-500 transform hover:scale-110 active:scale-95 ${
          showOptions || showChat
            ? "bg-[#1e293b] rotate-90 text-white"
            : "bg-gradient-to-br from-blue-500 via-indigo-600 to-violet-600 text-white shadow-blue-600/30"
        }`}
      >
        {showOptions || showChat ? (
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        ) : (
          <span className="text-2xl">🤖</span>
        )}
      </button>
    </div>
  );
}
```

### Touch Support (Mobile)

Add touch handlers for mobile devices in the same component:

```typescript
const handleTouchStart = (e: React.TouchEvent) => {
  if (showChat || showOptions) return;
  const touch = e.touches[0];
  setIsDragging(true);
  dragOffset.current = {
    x: touch.clientX - position.x,
    y: touch.clientY - position.y,
  };
  resetHideTimer();
};

const handleTouchMove = useCallback(
  (e: TouchEvent) => {
    if (!isDragging) return;
    const touch = e.touches[0];
    const newX = Math.max(
      0,
      Math.min(window.innerWidth - 56, touch.clientX - dragOffset.current.x)
    );
    const newY = Math.max(
      0,
      Math.min(window.innerHeight - 56, touch.clientY - dragOffset.current.y)
    );
    setPosition({ x: newX, y: newY });
  },
  [isDragging]
);

// Add to useEffect with mouse handlers
document.addEventListener("touchmove", handleTouchMove);
document.addEventListener("touchend", handleMouseUp);
```

### Testing Checklist

- [ ] Bubble appears at bottom-right on load
- [ ] Bubble can be dragged to any position
- [ ] Bubble hides to side after 10 seconds inactivity
- [ ] Hover over hidden bubble reveals it
- [ ] Click shows options menu
- [ ] "Ask Smarty AI" opens chat window
- [ ] "Let Smarty Do" shows "Coming Soon" message
- [ ] Chat functionality works as before
- [ ] Works on mobile (touch drag)

---

## 6.1 Task 5 (Phase 2 & 3): n8n Orchestration & "Let Smarty Do"

### Goal
Implement a robust AI orchestration layer using n8n for parsing natural language, resolving ambiguity, and calling backend APIs. This includes a "confirm-before-execute" flow to ensure safety and transparency.

### Key Architectural Rules
1. **Backend is authoritative**: Authentication, permission checks, and final DB writes must be done by the backend API. n8n orchestrates but does not assume trust.
2. **Confirm before execute**: Any automated action that will create/update/delete persistent data must be confirmed by the user in plain language before execution.
3. **Allowlist actions only**: Define a restricted set of allowed automation intents. n8n must reject anything outside the allowlist.
4. **Traceability & Idempotence**: Every automation interaction produces an `automation_id` (UUID) for auditing.
5. **Error transparency**: Provide user-friendly reasons and actionable next steps on any error.

### Updated Flow: Natural Language -> Confirm -> Execute -> Report

1. **User (Frontend)**: Sends request `POST /smarty/automate` with `rawText` and context.
2. **Backend `/smarty/automate`**:
   - Validate JWT, extract `userId`.
   - Store an `automation_requests` row with `status: pending`.
   - Forward a structured envelope to n8n.
3. **n8n Workflow**:
   - Parse intent + slots (title, datetime, etc.).
   - Resolve ambiguous slots.
   - Return structured `intent` + `slots` + `needs_confirmation` + `summary` to backend.
4. **Backend -> Frontend**: Returns the `summary` and `needs_confirmation` flag.
5. **Frontend UI**: Shows a confirmation card with buttons (Confirm / Edit / Cancel).
6. **User Confirms**: Frontend calls `POST /smarty/automate/confirm` with `automation_id`.
7. **Execution**: n8n (or backend) executes final steps by calling secure backend endpoints.
8. **Finalization**: Backend updates `automation_requests` row to `done` or `failed`.
9. **Feedback**: Frontend displays final success/error message with a link to the resource.

### Backend Contract (APIs to Provide)

#### POST /smarty/automate
- **Auth**: Bearer JWT
- **Body**: `{ rawText: string, context?: object }`
- **Response**: `{ automation_id, needs_confirmation: boolean, summary, payload (optional) }`

#### POST /smarty/automate/confirm
- **Auth**: Bearer JWT
- **Body**: `{ automation_id: string }`
- **Behavior**: Validates automation row, triggers n8n execution, returns final result.

#### POST /internal/automation/execute
- **Internal Only**: Accepts `payload` and `automation_id`. Executes the business logic (e.g., calling `CalendarService`).

### Data Models

```sql
CREATE TABLE IF NOT EXISTS automation_requests (
  automation_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(user_id),
  raw_text TEXT NOT NULL,
  summary TEXT,
  payload JSONB,
  status VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending, confirmed, executing, done, failed
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Allowlist Actions
- `create_calendar_event`
- `create_reminder`
- `create_task`
- `assign_task`
- `mark_task_done`
- `reschedule_event`
- `send_group_message`

### Gemini 3 Pro Prompt (for Code Generation)

> **Purpose**: Single, explicit instruction prompt for generating specific implementation code.

```
SYSTEM: You are Code-Assist-Gemini, an expert full-stack engineer. Produce TypeScript-First production-ready code and test suites for a backend automation endpoint + example n8n workflow JSON. Follow the exact constraints below and output only files and code blocks in markdown. Do NOT include long explanations. Keep output concise but complete.

CONSTRAINTS:
- Target runtime: Node 18+, TypeScript, Express 4/5 compatible.
- DB: Postgres (use supabase client patterns). Use parameterized queries or Supabase JS client calls in examples.
- Validation: use zod for request validation and types.
- Auth: assume JWT middleware provides `req.user` with `{ user_id, email }`.
- All n8n communications must be via backend-to-n8n webhook URLs. Include sample HTTP calls (axios/fetch) the backend will use.
- Security: do not store secrets in code. Use env vars (e.g., `N8N_WEBHOOK_URL`, `N8N_SECRET`).
- Provide unit tests with Jest for API behavior and a mock n8n response.

REQUIRED OUTPUT FILES:
1) `apps/backend/src/routes/smarty.ts` - Express router with 2 endpoints: `POST /smarty/automate` and `POST /smarty/automate/confirm`.
2) `apps/backend/src/services/automationService.ts` - business logic to create `automation_requests` row, call n8n webhook, and perform execution handshake.
3) `apps/backend/src/schemas/automationSchemas.ts` - zod schemas and TypeScript types for payloads.
4) `apps/backend/src/tests/smarty.test.ts` - Jest tests mocking n8n responses and verifying DB calls and response shapes.
5) `n8n/smarty-automate-workflow.json` - an example n8n workflow JSON.
6) `examples/curl_samples.md` - two curl examples (initiate automation, confirm automation).

IMPLEMENTATION NOTES:
- `POST /smarty/automate` should: validate JWT, parse body via zod, create `automation_requests` record with status `pending`, call n8n webhook with `automation_id` and return n8n response to frontend.
- `POST /smarty/automate/confirm` should: validate JWT and `automation_id`, ensure `status: pending`, make confirm call to n8n or call internal execute endpoint which then calls internal business logic and updates DB.
- The automationService must retry network calls up to 2 times with exponential backoff and return clear errors.

OUTPUT FORMAT RULES:
- Each file must be a single fenced markdown code block preceded by `// FILE: <path>` on a single line.
- For TypeScript, include necessary imports and small comments where clarity helps.
- Tests should be runnable with `npm test` using Jest; mock network calls using `nock` or `jest.mock`.
- For the n8n workflow JSON, include at least 5 nodes with fake ids and an explanation line comment of each node's purpose at the top of the code block.

END.
```

### Testing & QA
- **Unit tests**: Backend permission checks and allowlist validation.
- **Integration tests**: Simulate n8n response JSONs and verify confirmation flow.
- **E2E smoke test**: Run scenario "create calendar event" verifying UI confirmation, DB row creation, calendar event creation, and notification.

## 7. Task 6: Group Enhancements

---

## Optional (Post-MVP): Reminders End-to-End

### Current State

- Reminders are referenced in UI copy/FAQ.
- Backend has partial scaffolding (DB insert + n8n reminder trigger), but reminders are not clearly surfaced via UI/API end-to-end.

### Goal

Support creating reminders for tasks/events and delivering them as in-app notifications (with optional n8n scheduling).

### Implementation Steps

- Backend: add minimal reminders API (create/list) and integrate with `NotificationService` when triggered.
- Calendar aggregation: decide whether reminders appear in calendar items or only as notifications.
- Frontend: add a minimal reminder field (date/time) in task create/edit flow and show pending reminders.
- Docs/UI text: ensure marketing/FAQ text matches actual reminder behavior.

### Current State Review

**Existing Group Features** (in `GroupDetailView.tsx` and `group.ts`):

- ✅ Create group with join code
- ✅ Join group via code
- ✅ View members
- ✅ Owner can change roles (admin/member)
- ✅ Owner can toggle admin permissions
- ✅ Remove members (owner/admin with permission)
- ✅ Group chat exists

### Features to Add

#### 6.0: Create Group — Add Members During Creation (Missing)

**Currently**: Create group flow creates an empty group or requires adding members after creation.
**Need**: Allow owners to select/add members at group creation time so the group is ready to use immediately.

##### Step 6.0.1: Update CreateGroupModal (Frontend)

**File**: `apps/frontend/src/components/CreateGroupModal.tsx` (edit)

- Add a multi-select or searchable user picker (reusing `InviteToGroupModal` search logic) to choose members while creating a group.
- Include an option to send invites (pending) vs. immediate add for existing users.
- Submit payload shape: `{ name, description, initial_member_ids?: string[], send_invites?: boolean }`.

##### Step 6.0.2: Update GroupService (Backend)

**File**: `apps/backend/src/services/group.ts`

- Add `createGroupWithMembers(createPayload)` method that performs a transaction:
  1. Create group record.
  2. Insert member records (or pending invites) using `initial_member_ids`.
  3. If `send_invites` is true, create notifications for those users.
- Ensure permission checks and error handling.

##### Step 6.0.3: API Endpoint

**File**: `apps/backend/src/index.ts`

- Add route: `POST /groups` to accept the extended payload, call `GroupService.createGroupWithMembers` and return group + added member summary.
- Add unit/integration tests for the endpoint.

##### Step 6.0.4: Testing

- [ ] Create group with members -> verify group membership immediately reflects on both creator and invitees.
- [ ] Create group with `send_invites=true` -> verify notifications are created and pending state for invitees.
- [ ] Edge cases: non-existent user ids, duplicate user ids, permission denied.

#### 6.1: Add User to Group (Invite by Username/Email)

**Currently**: Only join by code
**Need**: Owner/Admin can invite users directly

##### Step 6.1.1: Add Invite Modal Component

**File**: `apps/frontend/src/components/InviteToGroupModal.tsx` (NEW FILE)

```typescript
interface InviteToGroupModalProps {
  groupId: string;
  userId: string;
  onClose: () => void;
  onInvited: () => void;
}
```

Features:

- Search users by email/username
- Send invite (creates pending member or notification)
- Show pending invites

##### Step 6.1.2: Add Backend Endpoint

**File**: `apps/backend/src/index.ts`

Add endpoint:

```typescript
app.post("/groups/:groupId/invite", async (req, res) => {
  const { requesterId, targetUserEmail } = req.body;
  // Verify requester has permission
  // Find target user
  // Create invite/add as pending
  // Send notification
});
```

##### Step 6.1.3: Update GroupService

**File**: `apps/backend/src/services/group.ts`

Add method:

```typescript
static async inviteUser(groupId: string, targetEmail: string, requesterId: string): Promise<void> {
    // Verify permission
    // Find user by email
    // Add as pending member
    // Create notification
}
```

#### 6.2: Role Permission System

**Current**: Owner and Admin roles exist
**Enhancement**: More granular permissions UI

Already partially implemented in `GroupDetailView.tsx`:

- `can_manage_members` toggle for admins

Add UI to show permission matrix:

- Can manage members (add/remove)
- Can assign tasks
- Can manage chat settings

#### 6.3: Attachment Support in Group

**Files to modify**:

- `apps/frontend/src/components/Chat.tsx` (already has file upload)
- `apps/backend/src/index.ts` (add group-specific storage)

Enhancement:

- Add "Files" tab in `GroupDetailView.tsx`
- List shared files with metadata
- Allow download/preview

##### Step 6.3.1: Create GroupFiles Component

**File**: `apps/frontend/src/components/GroupFiles.tsx` (NEW FILE)

```typescript
interface GroupFilesProps {
  groupId: string;
  userId: string;
  canUpload: boolean;
}
```

##### Step 6.3.2: Add Files Tab to GroupDetailView

**File**: `apps/frontend/src/components/GroupDetailView.tsx`

Add 'files' to ViewTab type and render `<GroupFiles />` component.

#### 6.4: Assign Task to Group Members

**Current**: Task creation exists in `CreateTaskModal.tsx`
**Enhancement**: Assign to specific members

##### Step 6.4.1: Update CreateTaskModal

**File**: `apps/frontend/src/components/CreateTaskModal.tsx`

Add:

- Member dropdown/multi-select (when groupId provided)
- Fetch group members
- Pass assignee_ids to backend

##### Step 6.4.2: Update TaskService

**File**: `apps/backend/src/services/task.ts`

Update `createTask()` to:

- Accept `assignee_ids` array
- Create task_assignments records
- Send notifications to assignees

#### 6.5: Group Chat

**Status**: ✅ Already implemented in `Chat.tsx`

Already working via:

- `GroupDetailView.tsx` renders `<Chat groupId={...} />`
- Socket.io room joining
- Message persistence

#### 6.6: Group Notifications

Integrate with Task 1 notification system:

- Member added → notify new member
- Role changed → notify affected member
- Task assigned → notify assignees
- New message → notify inactive members

---

## 8. Task 7: User Enhancements

### Features to Add

#### 7.1: User Attachment (Profile/Files)

**Files to modify**:

- `apps/frontend/src/app/dashboard/settings/page.tsx`
- `apps/backend/src/services/auth.ts`

##### Step 7.1.1: Add Avatar Upload

In settings page, add:

- Profile picture upload
- Store in Supabase Storage
- Update user record with avatar_url

#### 7.2: User Notifications

Covered in Task 1 notification system.

#### 7.3: Basic Chat Function (User to User DM)

**Status**: ✅ Already implemented

Working via:

- `GroupService.getOrCreateDirectChat()` creates DM "group"
- Chat page shows DM conversations
- `handleConversationClick()` handles DM selection

#### 7.0: Friend Request Flow (Accept / Reject) (Missing)

**Problem**: The high-level `implementation_plan.md` explicitly called out accept/reject logic for friend requests — ensure this flow is implemented and visible in UI.

##### Step 7.0.1: Backend — Friend Service / DB

**File**: `apps/backend/src/services/friend.ts` and migrations

- Ensure `friend_requests` table has a `status` column (enum: `pending`, `accepted`, `rejected`) and `created_at`.
- Add methods:
  - `sendFriendRequest(fromUserId, toUserId)` -> creates `pending` request
  - `acceptFriendRequest(requestId, actorId)` -> set `status='accepted'`, create friendship record if separate, notify both users
  - `rejectFriendRequest(requestId, actorId)` -> set `status='rejected'` and optionally notify
- Add endpoints:
  - `POST /friends` -> send request
  - `PUT /friends/:requestId/accept` -> accept
  - `PUT /friends/:requestId/reject` -> reject
- Add unit tests for each action and authorization checks.

##### Step 7.0.2: Frontend — Friend Requests UI

**Files**: `apps/frontend/src/components/FriendList.tsx`, `AddFriendModal.tsx`

- Display incoming pending requests in a `Pending` tab or badge count.
- For each pending request show `Accept` and `Reject` buttons that call the new endpoints via `api.post` / `api.put`.
- On accept: update local state, create DM or friend entry, and show success toast.
- On reject: remove request from pending list and show feedback.
- Trigger notifications via NotificationService (Task 1).

##### Step 7.0.3: Testing

- [ ] Send friend request -> recipient sees pending request in UI
- [ ] Accept request -> both users see friendship in their lists and can DM
- [ ] Reject request -> requester sees rejection notification (optional)
- [ ] Endpoint authorization prevents unrelated users from acting on requests

#### 7.4: Remove Friend Feature

**Current**: Can add friends, accept requests
**Need**: Unfriend/remove friend

##### Step 7.4.1: Add Remove Friend UI

**File**: `apps/frontend/src/components/FriendList.tsx`

Add to each friend item:

```tsx
<button
    onClick={() => handleRemoveFriend(friend.relationship_id)}
    className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
    title="Remove friend"
>
    <svg className="w-4 h-4" ...><!-- trash icon --></svg>
</button>
```

##### Step 7.4.2: Add Remove Friend Service Method

**File**: `apps/backend/src/services/friend.ts`

Add method:

```typescript
static async removeFriend(relationshipId: string, requesterId: string): Promise<void> {
    // Verify the requester is part of this friendship
    const { data: request } = await supabase
        .from('friend_requests')
        .select('*')
        .eq('request_id', relationshipId)
        .single();

    if (!request) throw new Error('Friend relationship not found');

    // Verify requester is either from_user_id or to_user_id
    if (request.from_user_id !== requesterId && request.to_user_id !== requesterId) {
        throw new Error('You are not part of this friendship');
    }

    // Delete the relationship
    const { error } = await supabase
        .from('friend_requests')
        .delete()
        .eq('request_id', relationshipId);

    if (error) throw new Error(error.message);

    // Optional: Delete DM group if exists
    // Optional: Notify the other user
}
```

##### Step 7.4.3: Add Backend Endpoint

**File**: `apps/backend/src/index.ts`

Add endpoint:

```typescript
app.delete("/friends/:relationshipId", async (req, res) => {
  try {
    const { requesterId } = req.body;
    await FriendService.removeFriend(req.params.relationshipId, requesterId);
    res.json({ success: true });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});
```

##### Step 7.4.4: Update Frontend API Call

**File**: `apps/frontend/src/components/FriendList.tsx`

Add handler:

```typescript
const handleRemoveFriend = async (relationshipId: string) => {
  if (!confirm("Are you sure you want to remove this friend?")) return;

  try {
    await api.delete(`/friends/${relationshipId}`, { requesterId: userId });
    fetchFriends(); // Refresh list
  } catch (error) {
    alert("Failed to remove friend");
  }
};
```

---

## 9. Task 8: Dashboard UI Implementation

### Goal

Update the Dashboard page (`apps/frontend/src/app/dashboard/page.tsx`) to match the provided design, featuring "Upcoming Events" and "My Pending Tasks" widgets side-by-side.

### Implementation Steps

#### Step 8.1: Update Dashboard Layout

**File**: `apps/frontend/src/app/dashboard/page.tsx`

- Keep the header ("My Calendar", "Manage your schedule...").
- Replace the single `CalendarWidget` with a **2-column grid** (on large screens).
  - **Left Column**: "Upcoming Events" card.
  - **Right Column**: "My Pending Tasks" card.

#### Step 8.2: Create "Upcoming Events" Widget

**File**: `apps/frontend/src/components/UpcomingEventsWidget.tsx` (NEW)

- **Data**: Fetch events from `CalendarService` (or reuse existing logic).
- **UI**:
  - Card title: "Upcoming Events" (with calendar icon).
  - List items:
    - **Date Box**: Month (top), Day (bottom) - e.g., "DEC 26".
    - **Details**: Title (bold), Time (small text).
    - **Icon**: Small group/meeting icon on the right (if applicable).
  - Styling: Dark card background, rounded corners.

#### Step 8.3: Create "My Pending Tasks" Widget

**File**: `apps/frontend/src/components/PendingTasksWidget.tsx` (NEW)

- **Data**: Fetch tasks from `TaskService` (filter by status != 'done').
- **UI**:
  - Card title: "My Pending Tasks" (with clipboard icon).
  - List items:
    - **Title**: Bold text (e.g., "test1").
    - **Priority Badge**: Small colored badge (Yellow=MEDIUM, Red=HIGH).
    - **Due Date**: "Due: MM/DD/YYYY".
    - **Indicator**: Vertical colored bar on the right edge (e.g., purple).
  - Styling: Dark card background, rounded corners.

#### Step 8.4: Sidebar Footer Update

**File**: `apps/frontend/src/components/Sidebar.tsx`

- Ensure the user profile section at the bottom matches the design:
  - Avatar (Circle).
  - Name & Email.
  - Notification Bell.
  - Logout Icon.
  - **Note**: Do NOT implement the Theme Toggle (Sun icon) as per Task 4 cancellation.

### Testing Checklist

- [ ] Dashboard shows 2 columns on desktop.
- [ ] "Upcoming Events" lists correct events with date/time.
- [ ] "My Pending Tasks" lists correct tasks with priority/due date.
- [ ] Sidebar footer shows correct user info.

---

## 10. Task Logic Behind Tasks (Owner/Assignee/Admin)

### Goal

Define and implement the correct task flow so responsibilities are clear and testable:

- **Who creates the task**: usually Group Owner/Admin (depending on permission)
- **Who does the task**: one or many assignees (group members)
- **Admin panel**: provide oversight for moderation and debugging (minimal MVP)

### Definitions

- **Creator (Owner/Admin)**: user who creates the task record.
- **Assignee(s)**: user(s) responsible for completing the task.
- **Watcher (optional)**: members who can view but not edit.

### Proposed Task Flow (MVP)

1. **Create Task**
   - Creator selects: title, description, due date, priority (if exists), and **assignee(s)**.
   - Backend validates creator permission:
     - If task is inside a group: only Owner/Admin (or role permission) can create.
     - If personal task: creator is the owner.
2. **Assign Task**
   - Create one task record and one-or-many task assignment records (or a task table with assignee_id array, but prefer normalized join table).
   - Send notifications to assignees (`type: "task_assigned"`).
3. **Work & Status Update**
   - Assignees can change status: `todo -> in_progress -> done`.
   - Only creator (or Owner/Admin) can delete the task.
4. **Completion**
   - When all assignees mark done (or primary assignee done), task is considered complete.
   - Notify creator (optional MVP).

### Backend Checks (Must Implement)

- Authorization:
  - Only creator / group Owner / allowed Admin can edit core fields (title, due date, assignments)
  - Assignees can update status and add comments (if feature exists)
- Data integrity:
  - Assignee must be a member of the group
  - No duplicate assignment rows

### Admin Panel (Minimal MVP)

Purpose: create a real **Admin Page** for the **system owner** to verify data, do limited CRUD, and unblock issues. Keep minimal.

#### Admin Page Route (Option 1)

- **Route**: `/admin`
- **Who can access**: **Owner only** (system-level owner)
- **Status in repo today**: the page already exists but currently uses a mock check and allows any logged-in user.

Files involved:

- `apps/frontend/src/app/admin/page.tsx` (must enforce owner-only access)
- `apps/frontend/src/app/admin/layout.tsx` (admin shell/navigation)
- `apps/frontend/src/components/Sidebar.tsx` (optional: show “Admin” link only to owner)

**Rule**: do not rely on `localStorage` role checks for security. Frontend checks are only UX. The backend must enforce owner-only access for any admin endpoints.

Minimum screens/actions:

- View users (basic info)
- View groups (members)
- View tasks (creator, assignees, status)
- View notifications (recent, unread counts)

Recommended MVP actions (safe + useful):

- Search + view details
- Limited CRUD:
  - Disable/enable user (or mark status) instead of hard-deleting
  - Delete spam notifications/messages only if necessary
- Export ("backup"):
  - MVP: provide **data export** (CSV/JSON) for key tables
  - Real backups should be handled by Supabase/Postgres automated backups (not by a UI button)

#### Role Model Clarification (Very Important)

Your app has **two different role concepts**:

1. **System/App role** (global): used for `/admin` access

   - Use `users.role` with values like: `owner`, `member` (and optionally `admin` if you truly need it system-wide).
   - **Requirement from team**: only `owner` can access `/admin`.

2. **Group role** (per-group): used inside groups
   - Use `group_members.role` with values: `owner`, `admin` (secretary/support role), `member`.
   - This controls group permissions (invite/remove members, assign tasks, etc.), not `/admin`.

### Implementation Notes (Where to Change)

- Frontend:
  - `apps/frontend/src/components/CreateTaskModal.tsx`: add assignee selection (single/multi)
  - Task UI: show creator + assignee(s) + status
- Backend:
  - `apps/backend/src/services/task.ts`: accept assignees, enforce membership/permissions
  - Add/verify `task_assignments` table if not present
  - Emit notifications when assigned
  - Add admin-only endpoints (if needed) and enforce `users.role === 'owner'` server-side

### Testing Checklist

- [ ] Owner/Admin can create group task
- [ ] Member without permission cannot create group task
- [ ] Task can be assigned to 1 user
- [ ] Task can be assigned to multiple users
- [ ] Assignee can update status
- [ ] Non-assignee cannot update status
- [ ] Notifications created for each assignee

---

## 11. Full Function Double-Check Checklist (Before Demo / Merge)

### Pre-flight (before any testing)

- [ ] ✅ Backend `.env` exists and includes: `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `JWT_SECRET`
- [ ] ✅ Frontend `.env.local` exists and includes `NEXT_PUBLIC_API_URL` (and Supabase keys if used)
- [ ] ✅ Install deps at repo root: `npm install`
- [ ] ✅ Build/typecheck before running:
  - Backend: `npm -w apps/backend run build`
  - Frontend: `npx tsc -p apps/frontend/tsconfig.json --noEmit`
- [ ] ✅ Start dev servers (2 terminals):
  - Backend: `cd apps/backend && npm run dev` (http://localhost:3001)
  - Frontend: `cd apps/frontend && npm run dev` (http://localhost:3000)

### Automated API Smoke-Test (PowerShell)

Use this to validate end-to-end flows quickly with **2 accounts** (creates a temporary user automatically):

```powershell
$ErrorActionPreference = 'Stop'

# 1) Login primary demo user
$u1 = Invoke-RestMethod -Method Post -Uri 'http://localhost:3001/auth/login' -ContentType 'application/json' -Body (@{ email='abc1@gmail.com'; password='123456' } | ConvertTo-Json)
$u1Id = $u1.user.user_id
$u1Headers = @{ Authorization = "Bearer $($u1.token)" }

# 2) Register + login a second temporary user
$suffix = Get-Date -Format 'yyyyMMdd_HHmmss'
$u2Email = "test_theme2_$suffix@example.com"
$u2Username = "testuser_theme2_$suffix"

Invoke-RestMethod -Method Post -Uri 'http://localhost:3001/auth/register' -ContentType 'application/json' -Body (@{ username=$u2Username; email=$u2Email; password='123456' } | ConvertTo-Json) | Out-Null
$u2 = Invoke-RestMethod -Method Post -Uri 'http://localhost:3001/auth/login' -ContentType 'application/json' -Body (@{ email=$u2Email; password='123456' } | ConvertTo-Json)
$u2Id = $u2.user.user_id
$u2Headers = @{ Authorization = "Bearer $($u2.token)" }

# 3) Friend request u1 -> u2, then accept as u2
Invoke-RestMethod -Method Post -Uri 'http://localhost:3001/friends' -Headers $u1Headers -ContentType 'application/json' -Body (@{ userId=$u1Id; friendIdentifier=$u2Email } | ConvertTo-Json) | Out-Null
$u2Friends = Invoke-RestMethod -Method Get -Uri "http://localhost:3001/friends/$u2Id" -Headers $u2Headers
$pending = $u2Friends | Where-Object { $_.status -eq 'pending' } | Select-Object -First 1
Invoke-RestMethod -Method Put -Uri "http://localhost:3001/friends/$($pending.id)/accept" -Headers $u2Headers | Out-Null

# 4) DM chat create + send/fetch 1 message
$dm = Invoke-RestMethod -Method Post -Uri 'http://localhost:3001/chats/dm' -Headers $u1Headers -ContentType 'application/json' -Body (@{ user1Id=$u1Id; user2Id=$u2Id } | ConvertTo-Json)
Invoke-RestMethod -Method Post -Uri "http://localhost:3001/chats/$($dm.groupId)/messages" -Headers $u1Headers -ContentType 'application/json' -Body (@{ userId=$u1Id; content="hello ($suffix)" } | ConvertTo-Json) | Out-Null
$msgs = Invoke-RestMethod -Method Get -Uri "http://localhost:3001/chats/$($dm.groupId)/messages" -Headers $u1Headers

# 5) Task create -> submit -> review (checks task submission workflow)
$task = Invoke-RestMethod -Method Post -Uri 'http://localhost:3001/tasks' -Headers $u1Headers -ContentType 'application/json' -Body (@{ title="E2E Task $suffix"; description='self-test'; due_date=(Get-Date).AddDays(3).ToString('o'); status='todo'; priority='low'; created_by=$u1Id; user_id=$u2Id } | ConvertTo-Json)
$submission = Invoke-RestMethod -Method Post -Uri "http://localhost:3001/tasks/$($task.task_id)/submit" -Headers $u2Headers -ContentType 'application/json' -Body (@{ userId=$u2Id; content='submitted via API self-test'; attachments=@() } | ConvertTo-Json)
Invoke-RestMethod -Method Put -Uri "http://localhost:3001/tasks/submissions/$($submission.submission_id)/review" -Headers $u1Headers -ContentType 'application/json' -Body (@{ status='approved'; feedback='looks good' } | ConvertTo-Json) | Out-Null

# 6) Notifications sanity check
$u1Notifs = Invoke-RestMethod -Method Get -Uri "http://localhost:3001/notifications/$u1Id" -Headers $u1Headers
$u2Notifs = Invoke-RestMethod -Method Get -Uri "http://localhost:3001/notifications/$u2Id" -Headers $u2Headers

[PSCustomObject]@{
  createdUser2Email = $u2Email
  dmMessagesCount = @($msgs).Count
  u1UnreadNotifsCount = @($u1Notifs).Count
  u2UnreadNotifsCount = @($u2Notifs).Count
} | ConvertTo-Json
```

Expected:

- `dmMessagesCount` >= 1
- `u2UnreadNotifsCount` >= 1 after friend request
- `u1UnreadNotifsCount` increases after task submission

### UI Walkthrough (manual)

- [ ] ✅ Login page works: http://localhost:3000/login
- [ ] ✅ Dashboard loads after login: http://localhost:3000/dashboard
- [ ] ✅ Chat page loads, list renders, no console errors: http://localhost:3000/dashboard/chat
- [ ] ✅ Send a DM and see it persist after refresh
- [ ] ✅ Trigger a notification (friend request / task submission) and confirm:
  - Popup shows (3s auto-dismiss + X close)
  - Notification bell red dot clears after viewing
- [ ] ✅ Tasks page: create task, submit work, approve/reject, confirm status updates
- [ ] ✅ Calendar: create event and see it appear in unified list

**Rule**: Only mark ✅ after testing end-to-end (frontend UI + backend API + database changes) with at least 2 different user accounts.

### Auth

- [ ] ✅ Log in works (correct credentials)
- [ ] ✅ Log in fails properly (wrong password)
- [ ] ✅ Sign up works (new account)
- [ ] ✅ Sign up prevents duplicates (same email/username)
- [ ] ✅ Logout clears session (no stuck auth)

### Chat

- [ ] ✅ 1-to-1 chat works (send/receive messages)
- [ ] ✅ Add multiple friends, all appear correctly
- [ ] ✅ 1-to-many group chat works (send/receive messages)
- [ ] ✅ Create/join multiple groups, all appear correctly

### Tasks

- [ ] ✅ Create task works (basic fields)
- [ ] ✅ Assign task works (single assignee)
- [ ] ✅ Assign task works (multiple assignees, if supported)
- [ ] ✅ Update task status works

### Calendar

- [ ] ✅ Create event works
- [ ] ✅ View events works (correct date/time)
- [ ] ✅ Edit/delete event works (if supported)

### Dashboard

- [ ] ✅ Dashboard loads with no errors
- [ ] ✅ Widgets/components render correctly

### Settings

- [ ] ✅ Settings page loads
- [ ] ✅ Profile updates persist (if supported)

### Admin (Owner Only)

- [ ] ✅ `/admin` exists and loads for owner
- [ ] ✅ Non-owner is blocked/redirected from `/admin`
- [ ] ✅ Any admin endpoints are server-protected (not just frontend hidden UI)

## 📝 Implementation Order (Recommended)

### Phase 1: Quick Wins (1-2 hours)

1. ✅ Task 2: Remove online state
2. ✅ Task 3: Fix chat background

### Phase 2: Core Features (4-6 hours)

3. Task 4: Light/Dark mode (CANCELLED)
4. Task 5: Draggable AI bubble
5. Task 8: Dashboard UI Implementation

### Phase 3: Notifications (3-4 hours)

5. Task 1: Notification system

### Phase 4: Group & User Enhancements (4-6 hours)

6. Task 7.4: Remove friend
7. Task 6.1: Invite user to group
8. Task 6.3: Group attachments
9. Task 6.4: Task assignment

---

## 🚨 Important Notes for AI Agent

1. **DO NOT MODIFY** `Chat.tsx` logic - only UI changes allowed
2. **Always test** after each step before proceeding
3. **Use existing patterns** - check similar code in the project
4. **Preserve types** - TypeScript strict mode is enabled
5. **Follow existing styling** - Use Tailwind and existing custom classes
6. **Backend endpoints** - Always add error handling
7. **Socket events** - Use existing socket instance from `lib/socket.ts`
8. **Database changes** - Create migration files, don't modify existing data

---

## 🧪 Testing Commands

```bash
# Frontend
cd apps/frontend
npm run dev

# Backend
cd apps/backend
npm run dev

# Check types
npx tsc -p apps/frontend/tsconfig.json --noEmit
npm -w apps/backend run build
```

---

## 11. Task 9: Advanced Authentication

### Goal

Implement robust authentication methods including:
1.  **Sign in with Google** (OAuth)
2.  **Forgot Password** flow
3.  **Multi-method Login** (Email, Phone, Google)

### Strategy

To maintain compatibility with existing backend JWT logic (`middleware/auth.ts`), we will use a **Session Syc** approach:
1.  Frontend uses Supabase Client for OAuth/Magic Links.
2.  Frontend obtains Supabase Access Token.
3.  Frontend sends Supabase Token to Backend (`/auth/sync`).
4.  Backend verifies token with Supabase, syncs user to DB, and issues App JWT.
5.  Frontend stores App JWT and proceeds as logged in.

### Implementation Steps

#### Step 9.1: Backend Sync Endpoint

**File**: `apps/backend/src/services/auth.ts`

Method `syncSession(accessToken: string)`:
- Call `supabase.auth.getUser(accessToken)`
- Upsert user to `users` table
- Sign and return App JWT

**File**: `apps/backend/src/index.ts`
- Add `POST /auth/sync` route.

#### Step 9.2: Forgot Password Page

**File**: `apps/frontend/src/app/forgot-password/page.tsx`
- Simple form taking Email.
- Calls `supabase.auth.resetPasswordForEmail(email)`.

#### Step 9.3: Update Login UI

**File**: `apps/frontend/src/app/login/page.tsx`
- Add "Sign in with Google" button.
- Add "Sign in with Phone" (optional/placeholder if SMS not set up).
- Handle `onAuthStateChange` to trigger backend sync on successful OAuth login.

#### Step 9.4: Backend Notification for New Users (Optional)
- When a new user syncs for the first time, send a welcome notification.

---

## 12. Optional Add-ons (Post-MVP)

Keep these as **optional** (only do if time allows / after demo stability):

### Dev Experience

- Fix Next.js monorepo root warning by setting `turbopack.root` (or removing extra lockfiles so Next uses repo root reliably).
- Add root-level scripts for common tasks (e.g. `dev:frontend`, `dev:backend`, `typecheck`, `lint`) to reduce setup friction.
- Add a single `scripts/selftest.ps1` that runs the smoke-test and prints a clean pass/fail summary.

### Security (Minimal Hardening)

- Derive `userId` from JWT on protected endpoints (avoid trusting client-provided `userId` in request bodies/params).
- Enforce owner-only access to `/admin` routes on the backend (not just frontend checks).
- Add basic rate limiting on auth endpoints to reduce brute-force risk.

### Reliability

- Add a `/health` endpoint for quick “is backend alive?” checks.
- Add an API endpoint to dismiss/delete notifications (not just mark-as-read) to support the UI “close/remove from list” behavior.

### Testing

- Add a minimal Playwright smoke test: login -> dashboard -> chat page renders.

---

_Document created: December 26, 2025_
_Last updated: December 27, 2025_
