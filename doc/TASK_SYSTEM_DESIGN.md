# Task System Design

This document outlines the improved Task System design, modeled after platforms like Lark and Google Classroom, supporting full editability, submission history (error tracking), and a robust review workflow.

## 1. Core Workflow

The system follows a strict state-machine workflow driven by user actions:

### **Roles**
- **Owner (Creator)**: Can edit, reassign, review, and delete.
- **Assignee**: Can view, start, and submit work.

### **States**
1.  **To Do**: Task created and assigned.
2.  **In Progress**: Assignee has started working.
3.  **In Review**: Work submitted, pending Owner approval.
4.  **Done**: approved by Owner.
5.  **Rejection Loop**: If rejected, task reverts to **In Progress** (with feedback history).

## 2. Key Features

### **A. Full Editability (Owner)**
Owners can now edit task details **at any time**, even after assignment.
- **Editable Fields**: Title, Description, Priority, Due Date.
- **Re-Assignment**: Owners can change the assignee (Individual or Group) mid-task.
- **UI**: "Edit" button available in the Task Detail view.

### **B. Submission & Review (The "Progress & Error" Flow)**
This mimics the "Revision" cycle in Google Classroom.
1.  **Submission**: Assignee submits text + attachments.
2.  **Review**: Owner accepts or rejects.
3.  **Rejection**: 
    - Task status reverts to `In Progress`.
    - Assignee gets a notification with Feedback.
    - **History**: The failed submission is saved and visible in the **Submission History** log.

### **C. Submission History Log**
A new component in the Task Detail view shows the full timeline of work:
- *Attempt 1: Submitted -> Rejected (Feedback: "Fix the layout")*
- *Attempt 2: Submitted -> Approved*

## 3. Architecture

### **Database Schema (Existing)**
- `tasks`: Stores current state, assignee, and details.
- `task_submissions`: Stores every submission attempt (version control).

### **API Endpoints**
- `PUT /tasks/:id`: For editing details.
- `GET /tasks/:id/submissions`: **New endpoint** to fetch full history.
- `POST /tasks/:id/submit`: Creates a new submission record.
- `PUT /tasks/submissions/:id/review`: Updates specific submission status.

## 4. User Interface

- **Task Board/Table**: Shows current status breakdown.
- **Detail Modal**: The central hub.
    - Shows generic details.
    - Shows "Edit" button for Owner.
    - Shows "Submission History" list at the bottom.
    - Context-aware Action Buttons ("Start", "Submit", "Review").

## 5. Future Improvements
- **Comments**: Add a general comment thread separate from submissions.
- **Rubrics**: Add grading criteria for tasks.
