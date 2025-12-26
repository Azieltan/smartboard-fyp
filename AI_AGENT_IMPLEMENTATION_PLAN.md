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
5. [Task 4: Light/Dark Mode](#5-task-4-lightdark-mode-implementation)
6. [Task 5: Draggable AI Bubble with Options](#6-task-5-draggable-ai-bubble-with-options)
7. [Task 6: Group Enhancements](#7-task-6-group-enhancements)
8. [Task 7: User Enhancements](#8-task-7-user-enhancements)

---

## 1. Project Structure Overview

### Frontend (Next.js + TypeScript)
```
apps/frontend/src/
├── app/
│   ├── globals.css              # Global styles, animations
│   ├── layout.tsx               # Root layout with SmartyBubble
│   ├── page.tsx                 # Landing page
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

### Key Existing Patterns
- **API calls**: Use `api.get()`, `api.post()`, `api.put()`, `api.delete()` from `lib/api.ts`
- **Socket.io**: Import from `lib/socket.ts`, use `socket.emit()`, `socket.on()`
- **Styling**: Tailwind CSS with custom utilities in `globals.css`
- **Glass morphism**: Use `glass-panel` class
- **Gradients**: Use `bg-gradient-to-*` or predefined gradients

---

## 2. Task 1: Notification System (Pop-out Notifications)

### ⚠️ IMPORTANT: DO NOT modify Chat.tsx logic

### Goal
Create WhatsApp-style pop-out notifications in the chat sidebar for:
- Friend requests (received)
- Group invitations/additions
- New chat messages (when not in that chat)

### Implementation Steps

#### Step 1.1: Create Notification Types (Frontend)
**File**: `apps/frontend/src/types/notification.ts` (NEW FILE)
```typescript
export interface Notification {
    id: string;
    type: 'friend_request' | 'group_invite' | 'chat_message' | 'task_assigned';
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
await NotificationService.createNotification(
    targetFriendId,
    'friend_request',
    {
        title: 'New Friend Request',
        message: `${senderName} sent you a friend request`,
        sender_id: userId
    }
);
```

#### Step 1.5: Create NotificationPopup Component (Frontend)
**File**: `apps/frontend/src/components/NotificationPopup.tsx` (NEW FILE)

Design specs:
- Position: Fixed, top-right corner of chat sidebar
- Animation: Slide in from right, fade out after 5 seconds
- Style: Glass morphism with colored left border based on type
- Actions: Click to navigate, dismiss button

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
- Auto-dismiss after 5 seconds
- Stack notifications vertically

Socket events to listen:
- `notification:new` - New notification received
- `notification:friend_request` - Friend request specific
- `notification:group_invite` - Group invite specific

#### Step 1.7: Add NotificationManager to Chat Page
**File**: `apps/frontend/src/app/dashboard/chat/page.tsx`

Add import and render NotificationManager inside the chat layout (line ~145):
```tsx
import NotificationManager from '../../../components/NotificationManager';
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
io.to(userId).emit('notification:new', notification);
```

### Testing Checklist
- [ ] Send friend request → Recipient sees notification popup
- [ ] Add user to group → User sees notification popup
- [ ] New message in non-active chat → User sees notification popup
- [ ] Click notification → Navigate to relevant page
- [ ] Notification auto-dismisses after 5 seconds
- [ ] Multiple notifications stack properly

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
{conv.type === 'dm' && (
    <div className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-[#0f172a] bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]`} />
)}
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
bg-[url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')]
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
    <div className="relative z-10">
        {/* existing message rendering */}
    </div>
</div>
```

#### Step 3.3: Add Chat Pattern to globals.css
**File**: `apps/frontend/src/app/globals.css`

Add after line ~100:
```css
.chat-bg-pattern {
    background-image: 
        radial-gradient(circle at 1px 1px, rgba(255,255,255,0.03) 1px, transparent 0);
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

## 5. Task 4: Light/Dark Mode Implementation

### Goal
Add theme toggle supporting light and dark modes throughout the app.

### Implementation Steps

#### Step 5.1: Create Theme Context
**File**: `apps/frontend/src/context/ThemeContext.tsx` (NEW FILE)

```typescript
'use client';
import { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
    theme: Theme;
    toggleTheme: () => void;
    setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [theme, setTheme] = useState<Theme>('dark');

    useEffect(() => {
        const saved = localStorage.getItem('smartboard-theme') as Theme;
        if (saved) {
            setTheme(saved);
        } else if (window.matchMedia('(prefers-color-scheme: light)').matches) {
            setTheme('light');
        }
    }, []);

    useEffect(() => {
        document.documentElement.classList.remove('light', 'dark');
        document.documentElement.classList.add(theme);
        localStorage.setItem('smartboard-theme', theme);
    }, [theme]);

    const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) throw new Error('useTheme must be used within ThemeProvider');
    return context;
};
```

#### Step 5.2: Update Root Layout
**File**: `apps/frontend/src/app/layout.tsx`

Wrap with ThemeProvider:
```tsx
import { ThemeProvider } from '@/context/ThemeContext';

export default function RootLayout({ children }: { ... }) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
                <ThemeProvider>
                    {children}
                    <SmartyBubble />
                </ThemeProvider>
            </body>
        </html>
    );
}
```

#### Step 5.3: Add CSS Variables for Themes
**File**: `apps/frontend/src/app/globals.css`

Update `:root` and add `.light` class (lines 3-12):
```css
:root, .dark {
    --background: #0f172a;
    --foreground: #f8fafc;
    --card-bg: rgba(255, 255, 255, 0.05);
    --border-color: rgba(255, 255, 255, 0.1);
    --text-primary: #ffffff;
    --text-secondary: #94a3b8;
    --text-muted: #64748b;
    --primary: #3b82f6;
    --secondary: #64748b;
    --accent: #8b5cf6;
}

.light {
    --background: #f8fafc;
    --foreground: #0f172a;
    --card-bg: rgba(0, 0, 0, 0.03);
    --border-color: rgba(0, 0, 0, 0.1);
    --text-primary: #0f172a;
    --text-secondary: #475569;
    --text-muted: #94a3b8;
    --primary: #3b82f6;
    --secondary: #64748b;
    --accent: #8b5cf6;
}

body {
    background: var(--background);
    color: var(--foreground);
}
```

#### Step 5.4: Update Tailwind Config (if using v4)
**File**: `apps/frontend/tailwind.config.ts` or `tailwind.config.js`

Ensure dark mode is class-based:
```js
module.exports = {
    darkMode: 'class',
    // ...
}
```

#### Step 5.5: Create Theme Toggle Component
**File**: `apps/frontend/src/components/ThemeToggle.tsx` (NEW FILE)

```typescript
'use client';
import { useTheme } from '@/context/ThemeContext';

export function ThemeToggle() {
    const { theme, toggleTheme } = useTheme();
    
    return (
        <button
            onClick={toggleTheme}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 dark:bg-white/5 
                       light:bg-black/5 light:hover:bg-black/10 transition-colors"
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        >
            {theme === 'dark' ? (
                <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                </svg>
            ) : (
                <svg className="w-5 h-5 text-slate-700" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                </svg>
            )}
        </button>
    );
}
```

#### Step 5.6: Add Theme Toggle to Sidebar
**File**: `apps/frontend/src/components/Sidebar.tsx`

Import and add ThemeToggle near user profile section (around line 142):
```tsx
import { ThemeToggle } from './ThemeToggle';
// ...
// In the user profile section, add:
<ThemeToggle />
```

#### Step 5.7: Update Component Classes for Theme Support
Key components to update with theme-aware classes:
- `Sidebar.tsx` - Background, borders, text colors
- `Chat.tsx` - Message bubbles, backgrounds
- `dashboard/layout.tsx` - Main background
- `dashboard/chat/page.tsx` - Sidebar, content areas
- All modals and forms

Pattern to follow:
```tsx
// Instead of:
className="bg-[#0f172a] text-white"

// Use:
className="bg-[var(--background)] text-[var(--text-primary)]"

// Or Tailwind dark: prefix:
className="bg-slate-50 dark:bg-[#0f172a] text-slate-900 dark:text-white"
```

### Testing Checklist
- [ ] Theme persists after page refresh
- [ ] Toggle works in Sidebar
- [ ] All pages respect theme
- [ ] Colors are readable in both themes
- [ ] No flash of wrong theme on load

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
import { useState, useRef, useEffect, useCallback } from 'react';
import axios from 'axios';

interface Message {
    role: 'user' | 'assistant';
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
        { role: 'assistant', content: "Hi, I'm Smarty! Ask me anything about using SmartBoard." }
    ]);
    const [chatInput, setChatInput] = useState('');
    const [chatLoading, setChatLoading] = useState(false);
    
    // Refs
    const bubbleRef = useRef<HTMLDivElement>(null);
    const chatEndRef = useRef<HTMLDivElement>(null);
    const hideTimerRef = useRef<NodeJS.Timeout | null>(null);
    const lastInteractionRef = useRef<number>(Date.now());
    
    const [user, setUser] = useState<{ uid: string }>({ uid: '' });

    // Initialize position
    useEffect(() => {
        setPosition({
            x: window.innerWidth - 80,
            y: window.innerHeight - 80
        });
    }, []);

    // User setup
    useEffect(() => {
        const userStr = localStorage.getItem('user');
        if (userStr && userStr !== 'undefined') {
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
            y: e.clientY - position.y
        };
        resetHideTimer();
    };

    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (!isDragging) return;
        
        const newX = Math.max(0, Math.min(window.innerWidth - 56, e.clientX - dragOffset.current.x));
        const newY = Math.max(0, Math.min(window.innerHeight - 56, e.clientY - dragOffset.current.y));
        
        setPosition({ x: newX, y: newY });
    }, [isDragging]);

    const handleMouseUp = useCallback(() => {
        setIsDragging(false);
    }, []);

    useEffect(() => {
        if (isDragging) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
        }
        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, handleMouseMove, handleMouseUp]);

    // Click outside handler
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (bubbleRef.current && !bubbleRef.current.contains(event.target as Node)) {
                setShowOptions(false);
                setShowChat(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Chat scroll
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
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
        alert('This feature is still under development. Coming soon!');
    };

    const handleAsk = async () => {
        if (!chatInput.trim()) return;

        const userMessage = chatInput.trim();
        setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
        setChatInput('');
        setChatLoading(true);

        try {
            const res = await axios.post('https://n8n.h5preact.app/webhook/f66a2f4e-b415-4844-a6ef-e37c9eb072b9/chat', {
                action: 'sendMessage',
                sessionId: user.uid,
                chatInput: userMessage
            });

            let answer = "I didn't get a response.";
            if (typeof res.data === 'string') {
                answer = res.data;
            } else if (Array.isArray(res.data)) {
                answer = res.data.map((msg: any) => msg.text || JSON.stringify(msg)).join('\n');
            } else if (res.data.output) {
                answer = res.data.output;
            } else {
                answer = res.data.text || res.data.answer || JSON.stringify(res.data);
            }

            setMessages(prev => [...prev, { role: 'assistant', content: answer }]);
        } catch (error) {
            setMessages(prev => [...prev, { role: 'assistant', content: "Sorry, I'm having trouble connecting to Smarty right now." }]);
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
                cursor: isDragging ? 'grabbing' : 'grab',
                opacity: isHidden ? 0.3 : 1,
                transform: isHidden ? 'scale(0.8)' : 'scale(1)'
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
                            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-xl">🤖</div>
                            <div>
                                <h3 className="font-bold text-sm">Smarty AI</h3>
                                <p className="text-[10px] text-blue-100 opacity-80">Ready to help</p>
                            </div>
                        </div>
                        <button onClick={() => setShowChat(false)} className="hover:bg-white/20 rounded-full p-2 transition-colors">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>

                    {/* Chat Area */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-[#0f172a]/50">
                        {messages.map((msg, idx) => (
                            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-300`}>
                                <div className={`max-w-[85%] p-3 rounded-2xl text-sm shadow-md ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-br-none' : 'bg-[#1e293b] text-slate-100 rounded-tl-none border border-white/5'}`}>
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
                                onKeyDown={(e) => e.key === 'Enter' && handleAsk()}
                                disabled={chatLoading}
                            />
                            <button
                                onClick={handleAsk}
                                disabled={!chatInput.trim() || chatLoading}
                                className="w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center hover:bg-blue-500 disabled:opacity-50 transition-all shadow-lg shadow-blue-600/20"
                            >
                                <svg className="w-5 h-5 rotate-90" fill="currentColor" viewBox="0 0 24 24"><path d="M2.01 21L23 12L2.01 3L2 10L17 12L2 14L2.01 21Z" /></svg>
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
                    (showOptions || showChat) 
                        ? 'bg-[#1e293b] rotate-90 text-white' 
                        : 'bg-gradient-to-br from-blue-500 via-indigo-600 to-violet-600 text-white shadow-blue-600/30'
                }`}
            >
                {(showOptions || showChat) ? (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
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
        y: touch.clientY - position.y
    };
    resetHideTimer();
};

const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isDragging) return;
    const touch = e.touches[0];
    const newX = Math.max(0, Math.min(window.innerWidth - 56, touch.clientX - dragOffset.current.x));
    const newY = Math.max(0, Math.min(window.innerHeight - 56, touch.clientY - dragOffset.current.y));
    setPosition({ x: newX, y: newY });
}, [isDragging]);

// Add to useEffect with mouse handlers
document.addEventListener('touchmove', handleTouchMove);
document.addEventListener('touchend', handleMouseUp);
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

## 7. Task 6: Group Enhancements

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
app.post('/groups/:groupId/invite', async (req, res) => {
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
app.delete('/friends/:relationshipId', async (req, res) => {
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
    if (!confirm('Are you sure you want to remove this friend?')) return;
    
    try {
        await api.delete(`/friends/${relationshipId}`, { requesterId: userId });
        fetchFriends(); // Refresh list
    } catch (error) {
        alert('Failed to remove friend');
    }
};
```

---

## 📝 Implementation Order (Recommended)

### Phase 1: Quick Wins (1-2 hours)
1. ✅ Task 2: Remove online state
2. ✅ Task 3: Fix chat background

### Phase 2: Core Features (4-6 hours)
3. Task 4: Light/Dark mode
4. Task 5: Draggable AI bubble

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
npm run typecheck
```

---

*Document created: December 26, 2025*
*Last updated: December 26, 2025*
