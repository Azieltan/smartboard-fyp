CPT4214

**INTERIM REPORT**

Automated Collaborative Workflow System (SmartBoard)

BY

SEE WING KIT

AZIEL TAN ZHENG CHUAN

VINCENT LOCK CHUN KIT

SESSION OCTOBER / NOVEMBER 2025

THE PROJECT REPORT IS PREPARED FOR

FACULTY OF COMPUTING AND INFORMATICS

MULTIMEDIA UNIVERSITY

IN PARTIAL FULFILLMENT

FOR

DIPLOMA IN INFORMATION TECHNOLOGY

FACULTY OF COMPUTING AND INFORMATICS

MULTIMEDIA UNIVERSITY

NOVEMBER 2025

Faculty of Computing and Informatics 2
CPT4214

**ABSTRACT**

The Automated Collaborative Workflow System (**SmartBoard**) is an AI-assisted platform designed to streamline calendar management, task assignment, and team collaboration through centralized workflows and automation. The system brings schedules, tasks, groups, and communication into a single interface and includes an integrated AI assistant (“Smarty”) to help users navigate features and trigger automation workflows.

SmartBoard enhances productivity by providing progress tracking and real-time in-app notifications that help users monitor task status and team updates. Advanced AI-driven capabilities such as recommending optimal meeting times and automated conflict detection are planned enhancements that build on the current calendar and task data foundation.

By centralizing collaboration activities and supporting intelligent automation, SmartBoard offers a more efficient and accessible solution for managing individual and team workloads in both academic and professional environments.

1. # **<a name="_toc214278506"></a>INTRODUCTION**

1. ## <a name="_toc214278507"></a>**Overview**
   <a name="_toc214278508"></a>In recent years, the rapid growth of digital technologies has significantly changed the way individuals and teams collaborate, especially in academic and professional environments. The increasing adoption of remote work, online learning, and hybrid working models has created a strong demand for digital collaboration systems that support communication, task coordination, and workflow management through online platforms.

Modern collaborative workflow systems integrate technologies such as cloud computing, web-based applications, and artificial intelligence to enable users to manage tasks, schedules, and team activities in a centralized environment. These systems allow users to access information anytime and anywhere, improving flexibility and productivity. Features such as real-time notifications, shared calendars, and progress tracking have become common trends to support efficient collaboration.

Artificial intelligence is increasingly being used to automate routine workflow processes, including task prioritization, scheduling assistance, and progress monitoring. By reducing manual effort and supporting intelligent decision-making, AI-powered systems help users manage workloads more effectively. In addition, user-friendly interface design has become a key focus to ensure that systems are accessible to users with different technical backgrounds.

The proposed SmartBoard system is developed in response to these trends, aiming to provide an automated, centralized, and user-friendly collaborative workflow platform. By leveraging current technologies and focusing on intelligent automation, SmartBoard seeks to improve efficiency, organization, and collaboration in both academic and professional settings.

1. ## **Project Objectives**
1. <a name="_toc214278509"></a>**To design a centralized platform**

   That integrates task management, calendar scheduling, and team collaboration in a single interface, allowing users to easily monitor and coordinate activities.

1. **To implement intelligent automation**

   That assists in task assignment and workflow automation (via the “Smarty” assistant and n8n automation hooks). Advanced meeting-time suggestions and conflict detection are planned as future enhancements.

1. **To develop a user-friendly interface**

   That simplifies system navigation, improves accessibility, and minimizes learning time for users of varying technical backgrounds.

1. **To provide real-time notifications and progress tracking**

   Enabling users to stay informed about task updates, deadlines, and team performance.

1. **To evaluate the system’s effectiveness and usability**

   Ensuring that SmartBoard meets the intended goals of improving collaboration and workflow management compared to manual or partially automated systems.

   1. ## **Target Users**

1. **Small Discussion Groups**

   SmartBoard supports small teams by providing centralized task management, shared scheduling, and collaboration features. AI assistance is provided through the built-in “Smarty” assistant to guide users and help automate routine workflows.

1. **Office Staff and Employees**

   Office staff often face tight schedules, causing them to miss reminders or overlook important tasks. SmartBoard helps by centralizing tasks, deadlines, and calendar events, and by providing automated reminders and assistance to reduce manual planning and miscommunication.

1. **Educational Institutions**

   Lecturers, tutors, and students benefit greatly from centralized scheduling, task tracking, and automated reminders. SmartBoard helps organize classes, consultations, and assignment-related workflows by combining a shared calendar view, task deadlines/submissions, and team/group collaboration tools.

<a name="_toc214278510"></a>

1. ## **Project Scope**
   The **Automated Collaborative Workflow System (SmartBoard)** is a web-based application focusing on task and calendar management, workflow automation, and AI-assisted scheduling. Users must register and log in before they can access the system to create, edit, or view tasks and schedules.

This system primarily covers small discussion groups, office staff, and educational institutions, allowing them to manage personal and team schedules, track task progress, and receive automated reminders. AI-driven suggestions help users optimize their workflow and avoid scheduling conflicts, while in-app notifications ensure smooth communication.

This system primarily covers small discussion groups, office staff, and educational institutions, allowing them to manage personal and team schedules, track task progress, and receive in-app notifications. AI assistance and workflow automation hooks help users streamline routine actions, while advanced scheduling suggestions and conflict detection are planned enhancements.

In the current implementation, SmartBoard includes real-time chat (direct messages and group chats), group management (join codes, invitations, and role-based permissions), a shared calendar view (personal and group events), task management (creation, assignment, subtasks, and due dates), and a task submission & review workflow. Notifications are delivered as in-app notifications with real-time updates.

**Limitations:**

- The system does not currently integrate with external calendar apps like Google Calendar or Outlook.
- Real-time video conferencing is not provided; communication is limited to scheduling, notifications, and chat only.
- Offline functionality is not supported; an internet connection is required for using the application and for AI/automation features.
- Voice-to-text / voice commands are planned as a future enhancement and are not enabled in the current implementation.
- Automated reminder scheduling is planned; the current implementation focuses on due dates and in-app notifications for workflow events.
- It does not handle financial transactions, delivery or payment-related functions.
- The system’s scheduling and task automation are limited to the internal team or organization and do not integrate with external calendar services beyond the scope of the application.
- SmartBoard focuses on small to medium-sized teams; scalability for very large organizations may require additional development.

**Stretch Goals:**

- Integration with external calendar services (e.g., Google Calendar / Outlook sync).
- Voice-to-text / voice command support for interacting with the AI assistant.
- Analytics dashboard to track productivity trends, workload distribution, and task completion patterns.
- Enhanced AI capabilities for predictive scheduling and smarter workflow recommendations.
- More advanced security hardening (e.g., stricter role enforcement and database access policies).
- Scalability improvements for larger organizations and higher concurrent usage.

Faculty of Computing and Informatics 2

1. # <a name="_toc214278511"></a>**PRIMARY STUDY AND LITERATURE REVIEW**

1. ## <a name="_toc214278512"></a>**Primary Study / Literature Research**
   <a name="_toc214278513"></a>**Microsoft Teams**

Microsoft Teams is a widely used collaboration platform developed by Microsoft. It integrates communication, online meetings, file sharing, and basic task coordination into a single application. The system is commonly adopted in organizations and educational institutions.

**Design**\
Microsoft Teams uses a channel-based interface where users interact through chats, posts, and tabs. While the interface is comprehensive, it can appear cluttered and complex to new users due to the large number of features, menus, and notifications.

**Features and Functions**

- Real-time chat and group messaging
- Video and audio conferencing
- File sharing and document collaboration
- Calendar integration with Microsoft Outlook
- Limited task coordination through integrated tools

**Advantages**

- Strong integration with Microsoft 365 services
- Suitable for large teams and organizations
- Supports real-time collaboration and online meetings

**Disadvantages**

- Task and workflow management are not fully centralized
- Manual scheduling and coordination are still required
- Interface complexity may overwhelm non-technical users

_Figure 2.1 Microsoft Teams Main Interface_

**Google Meet**\
Google Meet is a video conferencing platform developed by Google and widely used for online meetings, virtual classes, and remote collaboration. It is commonly integrated with Google Workspace applications.

**Design**\
Google Meet features a clean and minimal interface focused primarily on video meetings. The design is simple and easy to navigate, but it provides limited support for task or workflow management.

**Features and Functions**

- Video and audio conferencing
- Screen sharing and presentation
- Meeting scheduling through Google Calendar
- Integration with Google Workspace tools

**Advantages**

- Simple and user-friendly interface
- Easy meeting setup and access
- Stable performance for online meetings

**Disadvantages**

- Lacks built-in task and workflow management
- Limited collaboration features beyond meetings
- Not suitable as a standalone workflow system

_Figure 2.2 Google Meet Meeting Interface_

**Zoom**

Zoom is a popular video conferencing platform widely used for virtual meetings, webinars, and online collaboration. It is commonly adopted in both professional and educational environments.

**Design**\
Zoom provides a straightforward interface focused on meeting controls such as audio, video, and screen sharing. While easy to use, the design prioritizes meetings rather than overall workflow management.

**Features and Functions**

- Video and audio conferencing
- Screen sharing and recording
- Breakout rooms for group discussions
- Chat during meetings

**Advantages**

- High-quality video and audio performance
- Easy to use with minimal learning curve
- Suitable for large online meetings

**Disadvantages**

- No built-in task or schedule management
- Collaboration is limited to live meetings
- Requires integration with other tools for workflow coordination

_Figure 2.3 Zoom Meeting Interface_

1. ## **Problem Statement**
   Objective:

To improve convenience for users by centralizing task management, scheduling, and collaboration into a single system.

Problem Statement:

Existing collaboration platforms such as Microsoft Teams, Google Meet, and Zoom are widely used for communication and online meetings. However, these systems mainly focus on messaging and video conferencing rather than providing a fully integrated and user-friendly workflow management experience. Users often need to switch between multiple tools to manage tasks, schedules, and team coordination, which reduces convenience and efficiency.

In addition, task assignment and meeting scheduling in current systems require significant manual effort. Users must manually check availability, assign responsibilities, and track progress, which increases administrative workload and the risk of miscommunication. The complexity of interfaces and the lack of intelligent automation further contribute to information overload, especially for users managing multiple projects or team members.

Therefore, there is a need for a collaborative workflow system that emphasizes ease of use, centralized task and schedule management, and intelligent support to reduce manual planning. The proposed SmartBoard system aims to address these problems by providing a more convenient, user-friendly, and efficient approach to managing collaboration workflows in both academic and professional environments.

<a name="_toc214278514"></a>

1. ## **System Features**
1. Admin

   1. View system overview (e.g., total users, active tasks)
   1. View recent activity (e.g., latest registrations)
   1. Monitor system status and basic logs
   1. Security features (in progress)

1. Group

   1. Create/join groups via join code
   1. Invite users to groups and manage membership/roles
   1. Assign tasks within a group

1. User

   1. Register and log into the system.
   1. Edit profile.
   1. Can chat with other users
   1. Add friend
   1. Join Group
   1. Create task
   1. Set Reminder

1. Chat

   1. Send files
   1. Send images
   1. Send message

1. Calendar

   1. View calendar
   1. Assign and create tasks
   1. Set reminders

1. Task

   1. Set submit deadlines
   1. Write description
   1. Set priority
   1. Set title name

1. # <a name="_toc214278515"></a>**SYSTEM DESIGN**

1. ## <a name="_toc214278516"></a>**Hardware/Software Requirements**
   1. ### <a name="_toc214278517"></a>**For Developer**

| **Component / Tool**        | **Description**                                                                        | **Price / Source**           |
| :-------------------------- | :------------------------------------------------------------------------------------- | :--------------------------- |
| **Computer / Laptop**       | Intel i5 or higher, 8GB RAM, 256GB SSD minimum                                         | Personal or University Lab   |
| **Operating System**        | Windows 10 / 11 or macOS                                                               | Already installed            |
| **IDE / Code Editor**       | Visual Studio Code or similar                                                          | Free / Community Edition     |
| **Programming Languages**   | TypeScript / JavaScript, HTML, CSS                                                     | Free                         |
| **Frameworks / Libraries**  | Next.js (React) for frontend, Express.js for backend, Socket.IO for real-time features | Free                         |
| **Database / Auth**         | Supabase (Postgres + Auth) for data storage and authentication                         | Free tier / Cloud service    |
| **Version Control**         | Git & GitHub                                                                           | Free                         |
| **AI / Automation Tools**   | n8n workflow automation + “Smarty” AI assistant integration (via webhook/API)          | Free / Cloud service         |
| **Web Browser for Testing** | Chrome / Firefox                                                                       | Free                         |
| **Other Tools**             | Figma / Canva for UI design                                                            | Free / Subscription optional |

1. ### <a name="_toc214278518"></a>**For User**

| **Requirement**         | **Description**                                          |
| :---------------------- | :------------------------------------------------------- |
| **Device**              | Desktop or laptop computer, tablet, or smartphone        |
| **Operating System**    | Windows, macOS, Android, iOS                             |
| **Web Browser**         | Chrome, Firefox, Edge, or Safari (latest versions)       |
| **Internet Connection** | Stable broadband or Wi-Fi connection                     |
| **Optional**            | Email account for notifications and login authentication |

The system is web-based, so no installation is required on the user’s device. Users only need a compatible web browser and an internet connection to access SmartBoard.

1. ## <a name="_toc214278519"></a>**Technical Diagram**
   1. ### <a name="_toc214278520"></a>**Context Diagram & Data Flow Diagram**

### **Context Diagram**

### ![A diagram of a computer

AI-generated content may be incorrect.](Aspose.Words.7f698092-65d1-4d2a-94a5-a9b31bb0ef7d.001.png)

**Data Flow Diagram**

![A screenshot of a computer

AI-generated content may be incorrect.](Aspose.Words.7f698092-65d1-4d2a-94a5-a9b31bb0ef7d.002.png)

### ![A screenshot of a computer

AI-generated content may be incorrect.](Aspose.Words.7f698092-65d1-4d2a-94a5-a9b31bb0ef7d.003.png)![A diagram of a computer

AI-generated content may be incorrect.](Aspose.Words.7f698092-65d1-4d2a-94a5-a9b31bb0ef7d.004.png)

1. ### ![A screenshot of a computer

AI-generated content may be incorrect.](Aspose.Words.7f698092-65d1-4d2a-94a5-a9b31bb0ef7d.005.png)<a name="_toc214278521"></a>**Entity Relationship Diagram**

<a name="_toc214278522"></a>

1. ### **Data Dictionary**
   ![A screenshot of a computer screen

AI-generated content may be incorrect.](Aspose.Words.7f698092-65d1-4d2a-94a5-a9b31bb0ef7d.006.png)

![A table of data with text

AI-generated content may be incorrect.](Aspose.Words.7f698092-65d1-4d2a-94a5-a9b31bb0ef7d.007.png)

1. # <a name="_toc214278523"></a>**SYSTEM PROTOTYPE**

This section explains screenshots of the major features of your proposed project. Please label each figure with appropriate numbering and title. You must provide the explanations too.

Sample:

![](Aspose.Words.7f698092-65d1-4d2a-94a5-a9b31bb0ef7d.008.png)

Figure 3.3.4 Customer Sign Up Page

In Figure 3.3.4, customer sign up page shows that customer needs to fill in the required fields in order to complete the registration process.
