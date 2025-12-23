export type FaqItem = {
  id: string;
  q: string;
  a: string;
};

export const FAQ_DATA: FaqItem[] = [
  {
    id: 'faq-what-is-smartboard',
    q: 'What is SmartBoard?',
    a: 'SmartBoard is a unified platform for academic and professional teams to manage calendars, tasks, and automated workflows with AI-powered assistance.',
  },

  // Feature-specific (used by homepage “Learn more” anchors)
  {
    id: 'faq-smart-calendar',
    q: 'How do I use the Smart Calendar?',
    a: 'Open Dashboard → Calendar to create, edit, and view events. It’s designed to help you track deadlines and schedules in one place.',
  },
  {
    id: 'faq-smart-reminders',
    q: 'How do Smart Reminders work?',
    a: 'Smart Reminders notify you about upcoming deadlines and important status changes. Create tasks/events with due dates, and SmartBoard will surface reminders based on time and activity.',
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
    a: 'Yes. SmartBoard supports smart reminders for deadlines and status changes.',
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
    a: 'Go to the File Submission page and use the upload button.',
  },
  {
    id: 'faq-automate',
    q: 'Can I automate repetitive tasks?',
    a: 'Yes. Use the “Let Smarty Do” feature to automate workflows.',
  },
  {
    id: 'faq-reset-password',
    q: 'How do I reset my password?',
    a: 'Click “Forgot Password” on the login page and follow the instructions.',
  },
  {
    id: 'faq-free',
    q: 'Is SmartBoard free to use?',
    a: 'SmartBoard offers both free and premium plans.',
  },
  {
    id: 'faq-view-all-tasks',
    q: 'How do I view all my tasks?',
    a: 'Visit the Task Board to see all your assigned tasks.',
  },
  {
    id: 'faq-google-calendar',
    q: 'Can I integrate SmartBoard with Google Calendar?',
    a: 'Integration options are available in the settings page.',
  },
  {
    id: 'faq-delete-group',
    q: 'How do I delete a group?',
    a: 'Only group admins can delete a group from the Groups page.',
  },
  {
    id: 'faq-ask-smarty',
    q: 'What is the “Ask Smarty” feature?',
    a: '“Ask Smarty” is an AI assistant that answers your questions about the platform.',
  },
  {
    id: 'faq-profile-picture',
    q: 'How do I change my profile picture?',
    a: 'Go to your account settings and upload a new profile image.',
  },
  {
    id: 'faq-assign-multiple',
    q: 'Can I assign tasks to multiple users?',
    a: 'Yes. You can assign tasks to one or more group members.',
  },
  {
    id: 'faq-complete-task',
    q: 'How do I mark a task as complete?',
    a: 'Click on the task and select “Mark as Complete.”',
  },
  {
    id: 'faq-export-calendar',
    q: 'Can I export my calendar?',
    a: 'Yes. Export options are available in the Calendar page.',
  },
  {
    id: 'faq-logout',
    q: 'How do I log out?',
    a: 'Click your profile icon and select “Log Out.”',
  },
  {
    id: 'faq-notifications',
    q: 'Can I customize notification settings?',
    a: 'Yes. Manage notifications in your account settings.',
  },
  {
    id: 'faq-view-members',
    q: 'How do I view group members?',
    a: 'Open the Groups page and select your group to see all members.',
  },
  {
    id: 'faq-recurring-events',
    q: 'Can I create recurring events?',
    a: 'Yes. When creating an event, select the recurrence option.',
  },
  {
    id: 'faq-support',
    q: 'How do I contact support?',
    a: 'Use the “Contact Support” link in the app menu.',
  },
  {
    id: 'faq-security',
    q: 'Is my data secure on SmartBoard?',
    a: 'Yes. SmartBoard uses industry-standard security practices.',
  },
  {
    id: 'faq-mobile',
    q: 'Can I use SmartBoard on mobile?',
    a: 'Yes. SmartBoard is mobile-friendly and works in your browser.',
  },
  {
    id: 'faq-switch-workspaces',
    q: 'How do I switch between workspaces?',
    a: 'Use the workspace switcher in the sidebar.',
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
    a: 'Yes. Use the search bar in the File Submission page.',
  },
  {
    id: 'faq-edit-task',
    q: 'How do I edit a task?',
    a: 'Click on the task and select “Edit Task.”',
  },
  {
    id: 'faq-email-notifications',
    q: 'Can I get email notifications?',
    a: 'Yes. Enable email notifications in your settings.',
  },
  {
    id: 'faq-archive-group',
    q: 'How do I archive a group?',
    a: 'Group admins can archive groups from the group settings.',
  },
  {
    id: 'faq-restore-tasks',
    q: 'Can I restore deleted tasks?',
    a: 'Deleted tasks can be restored from the task archive.',
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
    a: 'Use the filter options on the Task Board to show completed tasks.',
  },
  {
    id: 'faq-mentions',
    q: 'Can I mention users in chat?',
    a: 'Yes. Use @username to mention users in chat.',
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
    a: 'Check the Reminders section or your calendar.',
  },
  {
    id: 'faq-roles',
    q: 'Can I assign roles to group members?',
    a: 'Yes. Assign roles in the group settings.',
  },
  {
    id: 'faq-delete-file',
    q: 'How do I delete a file?',
    a: 'Select the file and click the delete icon.',
  },
  {
    id: 'faq-pin-messages',
    q: 'Can I pin important messages in chat?',
    a: 'Yes. Use the pin option on any message.',
  },
  {
    id: 'faq-invite',
    q: 'How do I invite someone to SmartBoard?',
    a: 'Use the invite link in your group or workspace.',
  },
  {
    id: 'faq-offline',
    q: 'Can I use SmartBoard offline?',
    a: 'SmartBoard requires an internet connection.',
  },
  {
    id: 'faq-change-email',
    q: 'How do I change my email address?',
    a: 'Update your email in account settings.',
  },
  {
    id: 'faq-task-history',
    q: 'Can I see who completed a task?',
    a: 'Yes. Task history shows who completed it.',
  },
  {
    id: 'faq-leave-group',
    q: 'How do I leave a group?',
    a: 'Go to group settings and select “Leave Group.”',
  },
  {
    id: 'faq-customize-dashboard',
    q: 'Can I customize my dashboard?',
    a: 'Yes. Drag and drop widgets to personalize your dashboard.',
  },
];
