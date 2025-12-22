'use client';
import { useState, useMemo } from 'react';

const FAQ_DATA: Array<{ q: string; a: string }> = [
  { q: 'What is SmartBoard?', a: 'SmartBoard is a unified platform for academic and professional teams to manage calendars, tasks, and automated workflows.' },
  { q: 'How do I add a new member to my group?', a: 'Go to the Groups page, select your group, and click "Add Member" to invite someone.' },
  { q: 'How can I create a new task?', a: 'Navigate to the Task Board and click the "Create Task" button.' },
  { q: 'Can I set reminders for my tasks?', a: 'Yes, SmartBoard supports smart reminders for deadlines and status changes.' },
  { q: 'How do I join an existing group?', a: 'Ask the group admin to send you an invite or use the group join code.' },
  { q: 'Is there a calendar feature?', a: 'Yes, SmartBoard includes an interactive calendar for scheduling events.' },
  { q: 'Can I chat with my team members?', a: 'Yes, use the built-in real-time chat feature for communication.' },
  { q: 'How do I upload files?', a: 'Go to the File Submission page and use the upload button.' },
  { q: 'Can I automate repetitive tasks?', a: 'Yes, use the "Let Smarty Do" feature to automate workflows.' },
  { q: 'How do I reset my password?', a: 'Click "Forgot Password" on the login page and follow the instructions.' },
  { q: 'Is SmartBoard free to use?', a: 'SmartBoard offers both free and premium plans.' },
  { q: 'How do I view all my tasks?', a: 'Visit the Task Board to see all your assigned tasks.' },
  { q: 'Can I integrate SmartBoard with Google Calendar?', a: 'Integration options are available in the settings page.' },
  { q: 'How do I delete a group?', a: 'Only group admins can delete a group from the Groups page.' },
  { q: 'What is the "Ask Smarty" feature?', a: '"Ask Smarty" is an AI assistant that answers your questions about the platform.' },
  { q: 'How do I change my profile picture?', a: 'Go to your account settings and upload a new profile image.' },
  { q: 'Can I assign tasks to multiple users?', a: 'Yes, you can assign tasks to one or more group members.' },
  { q: 'How do I mark a task as complete?', a: 'Click on the task and select "Mark as Complete."' },
  { q: 'Can I export my calendar?', a: 'Yes, export options are available in the Calendar page.' },
  { q: 'How do I log out?', a: 'Click your profile icon and select "Log Out."' },
  { q: 'Can I customize notification settings?', a: 'Yes, manage notifications in your account settings.' },
  { q: 'How do I view group members?', a: 'Open the Groups page and select your group to see all members.' },
  { q: 'Can I create recurring events?', a: 'Yes, when creating an event, select the recurrence option.' },
  { q: 'How do I contact support?', a: 'Use the "Contact Support" link in the app menu.' },
  { q: 'Is my data secure on SmartBoard?', a: 'Yes, SmartBoard uses industry-standard security practices.' },
  { q: 'Can I use SmartBoard on mobile?', a: 'Yes, SmartBoard is mobile-friendly and works in your browser.' },
  { q: 'How do I switch between workspaces?', a: 'Use the workspace switcher in the sidebar.' },
  { q: 'Can I see task deadlines in the calendar?', a: 'Yes, all task deadlines appear in your calendar view.' },
  { q: 'How do I remove a member from a group?', a: 'Group admins can remove members from the group settings.' },
  { q: 'Can I search for files?', a: 'Yes, use the search bar in the File Submission page.' },
  { q: 'How do I edit a task?', a: 'Click on the task and select "Edit Task."' },
  { q: 'Can I get email notifications?', a: 'Yes, enable email notifications in your settings.' },
  { q: 'How do I archive a group?', a: 'Group admins can archive groups from the group settings.' },
  { q: 'Can I restore deleted tasks?', a: 'Deleted tasks can be restored from the task archive.' },
  { q: 'How do I set task priorities?', a: 'When creating or editing a task, set its priority level.' },
  { q: 'Can I assign due dates to tasks?', a: 'Yes, every task can have a due date.' },
  { q: 'How do I view completed tasks?', a: 'Use the filter options on the Task Board to show completed tasks.' },
  { q: 'Can I mention users in chat?', a: 'Yes, use @username to mention users in chat.' },
  { q: 'How do I create a new group?', a: 'Go to the Groups page and click "Create Group."' },
  { q: 'Can I upload multiple files at once?', a: 'Yes, the file uploader supports multiple files.' },
  { q: 'How do I see upcoming deadlines?', a: 'Check the Reminders section or your calendar.' },
  { q: 'Can I assign roles to group members?', a: 'Yes, assign roles in the group settings.' },
  { q: 'How do I delete a file?', a: 'Select the file and click the delete icon.' },
  { q: 'Can I pin important messages in chat?', a: 'Yes, use the pin option on any message.' },
  { q: 'How do I invite someone to SmartBoard?', a: 'Use the invite link in your group or workspace.' },
  { q: 'Can I use SmartBoard offline?', a: 'SmartBoard requires an internet connection.' },
  { q: 'How do I change my email address?', a: 'Update your email in account settings.' },
  { q: 'Can I see who completed a task?', a: 'Yes, task history shows who completed it.' },
  { q: 'How do I leave a group?', a: 'Go to group settings and select "Leave Group."' },
  { q: 'Can I customize my dashboard?', a: 'Yes, drag and drop widgets to personalize your dashboard.' }
];

export default function Page() {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return FAQ_DATA;
    return FAQ_DATA.filter(item => item.q.toLowerCase().includes(q) || item.a.toLowerCase().includes(q));
  }, [query]);

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-4">Frequently Asked Questions</h1>
        <p className="text-sm text-slate-500 mb-6">Find answers to common questions about SmartBoard.</p>

        <div className="mb-6">
          <input
            type="search"
            placeholder="Search questions..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full p-3 rounded-lg border border-white/10 bg-white/5 focus:outline-none"
          />
        </div>

        <div className="space-y-3">
          {filtered.length === 0 && (
            <div className="p-4 bg-white/5 rounded-md text-slate-400">No results found.</div>
          )}

          {filtered.map((item, idx) => (
            <details key={idx} className="bg-white/3 p-4 rounded-lg border border-white/5">
              <summary className="cursor-pointer font-medium text-white">{item.q}</summary>
              <div className="mt-2 text-slate-300">{item.a}</div>
            </details>
          ))}
        </div>
      </div>
    </div>
  );
}
