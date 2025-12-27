# SmartBoard FYP - Quick Start Guide

## 🚀 New to SmartBoard? Start Here!

This guide will help you understand what SmartBoard can do and get started quickly.

---

## What is SmartBoard?

SmartBoard is an **all-in-one collaboration platform** that combines:
- 📅 **Calendar & Events** - Manage personal and team schedules
- ✅ **Task Management** - Track tasks with priorities and deadlines
- 💬 **Real-time Chat** - Group chats and direct messages
- 👥 **Groups** - Organize teams and share resources
- 🤖 **AI Assistant** - Automate tasks with Smarty

---

## Core Features Overview

### 1. Getting Started 🏁

**Register & Login**
- Create your account at `/register`
- Login at `/login` with your credentials
- Your dashboard will be at `/dashboard`

### 2. Your Dashboard 📊

The main dashboard (`/dashboard`) shows:
- Your calendar with events and task deadlines
- Upcoming tasks sidebar
- Quick actions to add friends and create tasks

### 3. Managing Tasks ✅

**Create Tasks** (`/dashboard/tasks`)
- Click "+ New Task" 
- Set title, description, due date, priority
- Assign to yourself or a group
- Add subtasks and reminders
- Tasks automatically appear on your calendar

**Task Priorities:**
- 🔴 High - Urgent tasks
- 🟡 Medium - Normal tasks  
- 🔵 Low - Nice to have

**Task Status:**
- 📋 To Do - Not started
- 🔄 In Progress - Working on it
- ✅ Done - Completed

### 4. Calendar & Events 📅

**View Calendar** (`/dashboard/calendar`)
- See all your events and task deadlines
- Color-coded by type (personal vs group)
- Click dates to create new events

**Create Events**
- Click "+ New Event" or drag on calendar
- Set time, duration, and title
- Share with groups or specific friends
- Events sync across all members

### 5. Groups 👥

**Create Groups** (`/dashboard/groups`)
- Click "Create Group"
- Add a name and invite friends
- Get a unique 6-character join code
- Share code with others to let them join

**Join Groups**
- Ask admin for the join code
- Enter code in "Join Group" modal
- Instantly become a member

**Group Features:**
- Dedicated group chat
- Shared calendar events
- Group task assignments
- File sharing in chat

### 6. Chat 💬

**Group Chat** (`/dashboard/chat`)
- Select a group from the sidebar
- Send text messages in real-time
- Upload and share files
- See message history

**Direct Messages**
- Click on a friend's name
- Start a private 1-on-1 conversation
- Same features as group chat

### 7. Friends 🤝

**Add Friends**
- Click "Add Friend" button
- Enter friend's email or user ID
- They'll appear in your friends list once accepted

**Friend Benefits:**
- Send direct messages
- Share calendar events
- Add to groups easily
- See their status

### 8. AI Assistant - Smarty 🤖

**What Smarty Can Do:**
- Add members to groups
- Create tasks automatically
- Create new groups
- Answer questions about SmartBoard

**How to Use Smarty:**
1. Click the Smarty bubble (bottom-right corner)
2. Use natural language commands like:
   - "Add John to Marketing group"
   - "Create a task called Website Design"
   - "Create a group called Development Team"
3. Ask questions like "How do I add a member?"

---

## Common Workflows

### Workflow 1: Starting a New Project

1. **Create a Group** → Name it after your project
2. **Invite Team Members** → Share the join code
3. **Create Tasks** → Break down the project
4. **Schedule Events** → Plan meetings and milestones
5. **Communicate** → Use group chat for updates

### Workflow 2: Personal Task Management

1. **Add Tasks** → List everything you need to do
2. **Set Priorities** → Mark urgent items as high priority
3. **Add Deadlines** → Set due dates for accountability
4. **Check Calendar** → See your schedule at a glance
5. **Track Progress** → Update status as you work

### Workflow 3: Team Communication

1. **Create Group Chat** → Happens automatically with new groups
2. **Share Files** → Upload documents, images
3. **Discuss Tasks** → Chat about specific assignments
4. **Coordinate Events** → Plan meetings in group calendar
5. **Get Notifications** → New tasks auto-post to chat

---

## Tips & Tricks 💡

### Productivity Tips
- ⭐ Use **high priority** for tasks due within 48 hours
- 📅 Schedule **calendar events** for fixed appointments
- ✅ Add **subtasks** to break down complex tasks
- 🔔 Set **reminders** for important deadlines
- 🎯 Assign tasks to **specific groups** for accountability

### Chat Tips
- 📎 **Upload files** directly in chat (images, PDFs, etc.)
- 🔔 New **group tasks** automatically post to chat
- 💬 Use **direct messages** for private conversations
- 🏷️ **@mention** coming soon!

### Smarty Tips
- 🤖 Use **natural language** - no special syntax needed
- ❓ Ask Smarty **"What can you do?"** for help
- ⚡ Try **"Let Smarty Do"** for quick automations
- 📚 Smarty learns from your commands

### Organization Tips
- 📁 Create separate **groups for different projects**
- 👥 Keep **friend list** updated for easy invites
- 🎨 Use **color-coding** in calendar to distinguish event types
- 🗂️ Review **dashboard** daily for overview

---

## Keyboard Shortcuts (Coming Soon)

| Shortcut | Action |
|----------|--------|
| `Ctrl + N` | New Task |
| `Ctrl + E` | New Event |
| `Ctrl + K` | Open Smarty |
| `Ctrl + /` | Search |

---

## API for Developers 🔧

SmartBoard provides a REST API for integrations:

**Base URL:** `http://localhost:3001`

**Authentication:** JWT Bearer Token

**Key Endpoints:**
```
POST   /auth/register          - Register new user
POST   /auth/login             - Login
GET    /tasks?userId={id}      - Get user tasks
POST   /tasks                  - Create task
POST   /groups                 - Create group
GET    /groups/:userId         - Get user groups
POST   /chats/:groupId/messages - Send message
GET    /calendar/:userId       - Get events
```

**Socket.IO Events:**
```javascript
socket.emit('join_room', roomId)
socket.on('new_message', (message) => {...})
```

---

## Troubleshooting 🔧

### Can't Login?
- Check your email and password
- Ensure backend is running (`npm run dev` in `apps/backend`)
- Check browser console for errors

### Messages Not Appearing?
- Verify Socket.IO connection
- Check that both users are in the same room
- Refresh the page

### Can't See Group Events?
- Ensure you're a member of the group
- Check that events have `shared_group_id` set
- Refresh the calendar view

### Smarty Not Responding?
- Verify N8N webhook is configured
- Check backend logs for errors
- Try a simpler command first

---

## Need Help? 📚

1. **Check Documentation:**
   - [Application Status Report](./APP_STATUS.md)
   - [应用现状报告 (中文)](./APP_STATUS_CN.md)
   - [Implementation Plan](./implementation_plan.md)

2. **Ask Smarty:**
   - Open Smarty chat bubble
   - Ask questions about features

3. **Report Issues:**
   - Check GitHub Issues
   - Create new issue with details

4. **Contact Team:**
   - Development team available for support

---

## What's Next? 🎯

**Coming Soon:**
- ✨ Typing indicators in chat
- 📱 Mobile responsive improvements
- 🔔 Push notifications
- 👤 Profile pictures
- 🎨 Custom themes
- 📊 Analytics dashboard

---

**Ready to dive in? Head to [localhost:3000](http://localhost:3000) and start collaborating!** 🚀
