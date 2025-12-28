export type FaqItem = {
  id: string;
  q: string;
  a: string;
};

export const FAQ_DATA: FaqItem[] = [
  {
    id: 'faq-what-is-smartboard',
    q: 'What is SmartBoard?',
    a: 'SmartBoard is a unified platform for academic and professional teams to manage calendars, tasks, and collaboration in one place, with AI assistance (Ask Smarty).',
  },

  // Feature-specific (used by homepage “Learn more” anchors)
  {
    id: 'faq-smart-calendar',
    q: 'How do I use the Smart Calendar?',
    a: 'Open Dashboard → Calendar to create, edit, and view events. It’s designed to help you track deadlines and schedules in one place.',
  },
  {
    id: 'faq-smart-reminders',
    q: 'How do notifications work?',
    a: 'SmartBoard helps you stay on track with due dates and in-app notifications for important workflow updates. Scheduled reminder delivery is planned as a future enhancement.',
  },
  {
    id: 'faq-real-time-chat',
    q: 'How do I use Real-time Chat?',
    a: 'Go to Dashboard → Chat (or open a Group and use its chat) to message teammates instantly. It’s built for quick collaboration while you work on tasks.',
  },

  // General product FAQs
  {
    id: 'faq-add-member',
    q: 'How do I add a new member to my group?',
    a: 'Go to the Groups page, select your group, and click “Add Member” to invite someone.',
  },
  {
    id: 'faq-create-task',
    q: 'How can I create a new task?',
    a: 'Navigate to the Task Board and click the “Create Task” button.',
  },
  {
    id: 'faq-task-reminders',
    q: 'Can I set reminders for my tasks?',
    a: 'SmartBoard currently supports due dates and in-app notifications for workflow updates. Scheduled reminders are planned as a future enhancement.',
  },
  {
    id: 'faq-join-group',
    q: 'How do I join an existing group?',
    a: 'Ask the group admin to send you an invite or use the group join code.',
  },
  {
    id: 'faq-calendar-feature',
    q: 'Is there a calendar feature?',
    a: 'Yes. SmartBoard includes an interactive calendar for scheduling events.',
  },
  {
    id: 'faq-chat-feature',
    q: 'Can I chat with my team members?',
    a: 'Yes. Use the built-in real-time chat feature for communication.',
  },
  {
    id: 'faq-upload-files',
    q: 'How do I upload files?',
    a: 'Files are uploaded when you submit a task for review: go to Dashboard → Tasks, open a task, click “Submit”, then attach files in the submission form.',
  },
  {
    id: 'faq-automate',
    q: 'Can I automate repetitive tasks?',
    a: 'Not yet. “Let Smarty Do” is planned as a future feature; currently, you can use “Ask Smarty” for guidance and help using the platform.',
  },
  {
    id: 'faq-reset-password',
    q: 'How do I reset my password?',
    a: 'You can change your password in Dashboard → Settings → Security & Password. Email-based “forgot password” reset is not available yet.',
  },
  {
    id: 'faq-free',
    q: 'Is SmartBoard free to use?',
    a: 'SmartBoard is currently an MVP/demo app and is free to use (no premium plan features are implemented).',
  },
  {
    id: 'faq-view-all-tasks',
    q: 'How do I view all my tasks?',
    a: 'Visit the Task Board to see all your assigned tasks.',
  },
  {
    id: 'faq-google-calendar',
    q: 'Can I integrate SmartBoard with Google Calendar?',
    a: 'Not yet. External calendar integrations (Google Calendar/Outlook) are planned as future enhancements.',
  },
  {
    id: 'faq-delete-group',
    q: 'How do I delete a group?',
    a: 'Group deletion is not fully supported yet. Currently, group owners can manage members/roles and regenerate the join code in Group Settings.',
  },
  {
    id: 'faq-ask-smarty',
    q: 'What is the “Ask Smarty” feature?',
    a: '“Ask Smarty” is an AI assistant that answers your questions about the platform.',
  },
  {
    id: 'faq-profile-picture',
    q: 'How do I change my profile picture?',
    a: 'Profile photo upload is not available yet. The app currently uses your initials as the default avatar (see Dashboard → Settings).',
  },
  {
    id: 'faq-assign-multiple',
    q: 'Can I assign tasks to multiple users?',
    a: 'Not currently. A task can be assigned to one user, or assigned to a group (optionally targeting a specific member). Multi-user assignment is not implemented yet.',
  },
  {
    id: 'faq-complete-task',
    q: 'How do I mark a task as complete?',
    a: 'Tasks follow a simple workflow: the assignee can “Start” a task and “Submit” it for review. The task owner reviews the submission and approves it to close the task (Done).',
  },
  {
    id: 'faq-export-calendar',
    q: 'Can I export my calendar?',
    a: 'Not yet. Calendar export (e.g., iCal/ICS) is not implemented in the current version.',
  },
  {
    id: 'faq-logout',
    q: 'How do I log out?',
    a: 'Click your profile icon and select “Log Out.”',
  },
  {
    id: 'faq-notifications',
    q: 'Can I customize notification settings?',
    a: 'Not yet. The current version supports in-app notifications (view/read) but does not include notification preference settings.',
  },
  {
    id: 'faq-view-members',
    q: 'How do I view group members?',
    a: 'Open the Groups page and select your group to see all members.',
  },
  {
    id: 'faq-recurring-events',
    q: 'Can I create recurring events?',
    a: 'Not yet. The current calendar supports creating one-time events; recurring events are a planned enhancement.',
  },
  {
    id: 'faq-support',
    q: 'How do I contact support?',
    a: 'Use Dashboard → Settings → Help & Support to access the FAQ. A dedicated “Contact Support” flow is not implemented yet.',
  },
  {
    id: 'faq-security',
    q: 'Is my data secure on SmartBoard?',
    a: 'SmartBoard uses authenticated access (Supabase Auth) and server APIs, but it is still an MVP. Use a strong password and avoid storing highly sensitive data.',
  },
  {
    id: 'faq-mobile',
    q: 'Can I use SmartBoard on mobile?',
    a: 'Yes. SmartBoard is mobile-friendly and works in your browser.',
  },
  {
    id: 'faq-switch-workspaces',
    q: 'How do I switch between workspaces?',
    a: 'Workspaces are not implemented. SmartBoard currently organizes collaboration through Groups.',
  },
  {
    id: 'faq-task-deadlines-in-calendar',
    q: 'Can I see task deadlines in the calendar?',
    a: 'Yes. Task deadlines appear in your calendar view.',
  },
  {
    id: 'faq-remove-member',
    q: 'How do I remove a member from a group?',
    a: 'Group admins can remove members from the group settings.',
  },
  {
    id: 'faq-search-files',
    q: 'Can I search for files?',
    a: 'Not yet. File search is not implemented. Attachments are managed within task submissions.',
  },
  {
    id: 'faq-edit-task',
    q: 'How do I edit a task?',
    a: 'Task editing (title/description) is limited in the current version. You can update task status (Start/Submit) and manage subtasks from the task details view.',
  },
  {
    id: 'faq-email-notifications',
    q: 'Can I get email notifications?',
    a: 'Not yet. Notifications are currently delivered inside the app only (in-app notifications).',
  },
  {
    id: 'faq-archive-group',
    q: 'How do I archive a group?',
    a: 'Not yet. Group archiving is not implemented in the current version.',
  },
  {
    id: 'faq-restore-tasks',
    q: 'Can I restore deleted tasks?',
    a: 'Not yet. Task archive/restore is not implemented in the current version.',
  },
  {
    id: 'faq-task-priorities',
    q: 'How do I set task priorities?',
    a: 'When creating or editing a task, set its priority level.',
  },
  {
    id: 'faq-task-due-dates',
    q: 'Can I assign due dates to tasks?',
    a: 'Yes. Every task can have a due date.',
  },
  {
    id: 'faq-view-completed',
    q: 'How do I view completed tasks?',
    a: 'Go to Dashboard → Tasks and open the “Completed” tab.',
  },
  {
    id: 'faq-mentions',
    q: 'Can I mention users in chat?',
    a: 'Not yet. @mentions are not implemented in the current chat UI.',
  },
  {
    id: 'faq-create-group',
    q: 'How do I create a new group?',
    a: 'Go to the Groups page and click “Create Group.”',
  },
  {
    id: 'faq-multi-upload',
    q: 'Can I upload multiple files at once?',
    a: 'Yes. The file uploader supports multiple files.',
  },
  {
    id: 'faq-upcoming-deadlines',
    q: 'How do I see upcoming deadlines?',
    a: 'Check your Calendar and Task Board (due dates), and watch in-app notifications for updates.',
  },
  {
    id: 'faq-roles',
    q: 'Can I assign roles to group members?',
    a: 'Yes. Assign roles in the group settings.',
  },
  {
    id: 'faq-delete-file',
    q: 'How do I delete a file?',
    a: 'Not yet. Deleting uploaded attachments is not implemented in the current version.',
  },
  {
    id: 'faq-pin-messages',
    q: 'Can I pin important messages in chat?',
    a: 'Not yet. Pinning messages is not implemented in the current chat UI.',
  },
  {
    id: 'faq-invite',
    q: 'How do I invite someone to SmartBoard?',
    a: 'Invite someone to your group using the group join code or the group invite flow (Groups → Invite/Add Member).',
  },
  {
    id: 'faq-offline',
    q: 'Can I use SmartBoard offline?',
    a: 'SmartBoard requires an internet connection.',
  },
  {
    id: 'faq-change-email',
    q: 'How do I change my email address?',
    a: 'Email changes are not supported in the current version (Dashboard → Settings shows email as read-only).',
  },
  {
    id: 'faq-task-history',
    q: 'Can I see who completed a task?',
    a: 'Partially. Task submissions show who submitted work, and owners can review/approve submissions. A full audit history view is not implemented yet.',
  },
  {
    id: 'faq-leave-group',
    q: 'How do I leave a group?',
    a: 'Not yet. Leaving a group from the UI is not implemented in the current version.',
  },
  {
    id: 'faq-customize-dashboard',
    q: 'Can I customize my dashboard?',
    a: 'Not yet. Drag-and-drop dashboard customization is not implemented in the current version.',
  },
];
