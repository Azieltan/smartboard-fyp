# System Testing - SmartBoard

This document contains the revised system testing plan for the SmartBoard application, covering 20 key functional areas with recorded results.

---

## Test Plan Summary

| Module | Total Tests | Pass | Fail |
|--------|-------------|------|------|
| Authentication | 3 | 3 | 0 |
| Dashboard | 2 | 2 | 0 |
| Task Management | 5 | 4 | 1 |
| Calendar & Events | 3 | 3 | 0 |
| Groups | 3 | 2 | 1 |
| Chat | 1 | 1 | 0 |
| Smarty AI | 3 | 2 | 1 |
| **Total** | **20** | **17** | **3** |

---

## 1. Authentication Module

| Test ID | Test Case | Expected Result | Actual Result | Status |
|---------|-----------|-----------------|---------------|--------|
| AUTH-01 | **Login with Valid Credentials**: Enter valid email and password, click "Login" button. | User should be able to login and be redirected to the dashboard. | Dashboard loaded with user's name displayed correctly. | Pass |
| AUTH-02 | **Login with Invalid Credentials**: Enter invalid email or password. | Login should be rejected. | System displayed "Invalid email or password" error. | Pass |
| AUTH-04 | **Google OAuth Login**: Click "Sign in with Google" button. | Redirection to Google and back to dashboard. | Authentication flow completed successfully. | Pass |

---

## 2. Dashboard Module

| Test ID | Test Case | Expected Result | Actual Result | Status |
|---------|-----------|-----------------|---------------|--------|
| DASH-01 | **View Dashboard**: Access main landing page after login. | Dashboard should load with all widgets populated. | All widgets (Calendar, Tasks, Events) displayed data. | Pass |
| DASH-03 | **Pending Tasks Widget**: View list of active tasks on dashboard. | Only active tasks should appear. | Correct list of "todo" status tasks displayed. | Pass |

---

## 3. Task Management Module

| Test ID | Test Case | Expected Result | Actual Result | Status |
|---------|-----------|-----------------|---------------|--------|
| TASK-02 | **Create New Task**: Fill in details and click "Create". | New task appears in "To Do" tab. | Task added successfully to the database and UI. | Pass |
| TASK-03 | **Attach Large File**: Upload a file > 10MB to a task. | System should accept or provide size warning. | **Operation timed out. User was not notified of the failure.** | **Fail** |
| TASK-06 | **Mark Task as Done**: Toggle completion checkbox. | Task moves to "Completed" tab. | Status updated to "completed" instantly. | Pass |
| TASK-09 | **View Task Details**: Click on task card to open modal. | All task metadata should be visible. | Modal displayed description, priority, and date. | Pass |
| TASK-10 | **Task Review**: Assignor approves a submitted task. | Task status updates to "completed". | Review workflow correctly updated task state. | Pass |

---

## 4. Calendar & Events Module

| Test ID | Test Case | Expected Result | Actual Result | Status |
|---------|-----------|-----------------|---------------|--------|
| CAL-01 | **View Calendar**: Open calendar page. | Events should be visible on their respective dates. | Calendar rendered with all user-created events. | Pass |
| CAL-02 | **Create Event**: Drag and select time slot to create meeting. | Event creation modal opens and saves. | Event saved and appeared on calendar grid. | Pass |
| CAL-05 | **Delete Event**: Select event and click Delete. | Event removed immediately. | Event disappeared from both grid and DB. | Pass |

---

## 5. Groups Module

| Test ID | Test Case | Expected Result | Actual Result | Status |
|---------|-----------|-----------------|---------------|--------|
| GRP-02 | **Create Group**: Enter name/description and click Create. | Group appears in sidebar. | Group created and user set as Admin. | Pass |
| GRP-03 | **Join Group with Expired Code**: Enter an invitation code past its limit. | Error message: "Invitation Expired". | **System displayed generic "Network Error" response.** | **Fail** |
| GRP-05 | **Add Member**: Invite user via username. | User receives notification. | Invitation sent and member appeared in list. | Pass |

---

## 6. Chat Module

| Test ID | Test Case | Expected Result | Actual Result | Status |
|---------|-----------|-----------------|---------------|--------|
| CHAT-02 | **Send Message**: Type text and send in a group chat. | Message appears for all members in real-time. | Message delivered instantly via Socket.io. | Pass |

---

## 7. Smarty AI Module

| Test ID | Test Case | Expected Result | Actual Result | Status |
|---------|-----------|-----------------|---------------|--------|
| AI-02 | **Ask Smarty - FAQ**: Ask about app navigation. | AI provides relevant instructions. | Smarty accurately described how to use groups. | Pass |
| AI-04 | **Smarty - Create Event**: Tell AI "Create meeting for tomorrow". | Event created for the correct date. | Event appeared on calendar for the next day. | Pass |
| AI-05 | **Smarty - Create Task**: Tell AI "Add task due Friday". | Task created with Friday's date. | **Task created, but due date used UTC (backdated by 8 hours).** | **Fail** |

---

## Testing Summary

### Overall Results
- **Total Test Cases**: 20
- **Passed**: 17
- **Failed**: 3
- **Pass Rate**: 85%

### Conclusion
The system testing phase successfully verified 20 critical functions of the SmartBoard platform. 
1. **Core Functionality**: Login, Task CRUD, and Calendar management are stable.
2. **Identified Issues**: During testing, three minor failures were identified:
   *   **TASK-03**: Large file uploads lack proper validation feedback.
   *   **GRP-03**: Group invitation error handling needs to be more specific.
   *   **AI-05**: Smarty AI requires better timezone synchronization for task creation.

These issues have been logged and will be addressed in the next development sprint. Overall, the system demonstrates high reliability for its core collaborative features.

---

*Verified on: February 9, 2026*
