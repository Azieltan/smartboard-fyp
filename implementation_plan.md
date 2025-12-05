# Implementation Plan: SmartBoard Calendar & Task Refactor

## Objective
Refine the Calendar and Task functionalities to separate concerns, improve UI/UX with a specific time selector, and integrate task assignments with chat notifications.

## 1. Backend Updates

### Task Service & API
- **Update `createTask`**:
  - Ensure it handles `assignee_id` (for individual users) and `group_id` (for group assignments).
  - **Trigger Notification**: When a task is created/assigned, automatically send a message to the corresponding Chat (Direct Message for user, Group Chat for group).
    - *Message Format*: "Task Assigned: [Task Title] - Due: [Date]"
- **Update `getTasks`**: Ensure it returns tasks with due dates for the calendar view.

### Calendar Service & API
- **Unified Fetch**: Create/Update an endpoint to fetch all calendar-relevant items for a user:
  - `calendar_events`
  - `reminders`
  - `tasks` (with due dates)

## 2. Frontend: Calendar Page (`/dashboard/calendar`)
*Note: We will create a dedicated `/calendar` route or significantly refactor the main dashboard to focus on this.*

### Features
- **View Only**: Display Events, Reminders, and Task Due Dates.
- **Add Actions**:
  - "Add Event" (Modal)
  - "Add Reminder" (Modal)
  - *Remove "Add Task" from this page.*
- **UI Components**:
  - **Full Calendar View**: Standard international format (Mon-Sun), showing days and dates.
  - **Drag-to-Select Time**: A custom UI component where users can drag a slider or numbers to set the time (Hour/Minute) instead of typing.

## 3. Frontend: Task Page (`/dashboard/tasks`)

### Features
- **Exclusive Task Creation**: This is the *only* place to create tasks.
- **Kanban/List View**: Connect existing UI to real backend data.
- **Create Task Modal**:
  - **Assignee Selector**: Dropdown to select a Friend or a Group.
  - **Date Picker**: Integrated with the Calendar view.
  - **Time Picker**: Use the new "Drag-to-Select" component.

## 4. Integration & Verification
- **Data Sync**: Verify that a task created in `/tasks` appears in `/calendar`.
- **Notifications**: Verify that assigning a task sends a real message to the chat.
- **UI UX**: Verify the "Drag-to-Select" time component works intuitively.

## Step-by-Step Execution Plan

1.  **Backend**: Implement `notifyAssignee` logic in `TaskService`.
2.  **Backend**: Ensure `getCalendarItems` returns merged data.
3.  **Frontend**: Create `TimeSelector` component (Drag UI).
4.  **Frontend**: Refactor `CalendarPage` to use the new layout and components.
5.  **Frontend**: Refactor `TasksPage` to use real data and the new Create Task flow with assignment.
