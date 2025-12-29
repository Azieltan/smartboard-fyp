# Mission: S.M.A.R.T. Collaboration Upgrade
## (Social, Management, Automation, Real-time, Tasks)

This mission aims to transform the current prototype into a fully functioning social collaboration platform. We will focus on "wiring up" the existing beautiful UI to the backend logic and filling in the missing features for Groups and Calendars.

## Phase 1: The Circle of Trust (Groups & Friends)
**Objective**: Enable fully functional group management and friend connections.
- [ ] **Friend System**:
    - Verify `AddFriendModal` sends correct requests.
    - Add "Accept/Reject" logic for friend requests (currently auto-adds? Need to check service).
- [ ] **Group Management**:
    - **Create Group**: Allow adding members *during* creation.
    - **Group Settings**: Implement the "Gear" icon functionality.
        - Rename Group.
        - View/Remove Members.
        - **"Join Code"**: Generate and display a unique code for others to join.
    - **Join by Code**: Add a mechanism for users to input a code and join a group instantly.

## Phase 2: Real-Time Comms (Chat)
**Objective**: Make the Chat alive and persistent.
- [ ] **Chat Component**:
    - Ensure `Chat.tsx` connects to the correct `socket.io` namespace/room.
    - Implement "Typing..." indicators.
    - **History**: Ensure scrolling up loads older messages (if pagination is needed) or just loads last 100 on mount.
- [ ] **Direct Messages (DM)**:
    - Currently, chat is group-based. Add support for One-on-One DMs with friends.

## Phase 3: The Shared Brain (Calendar)
**Objective**: Move from "My Calendar" to "Our Calendar".
- [ ] **Group Events**:
    - Update `CalendarService` to fetch events for *all groups* the user is in.
    - Update Frontend to color-code events by Group vs. Personal.
- [ ] **Event Creation**:
    - Add "Assign to Group" dropdown in `CreateEventModal`.

## Phase 5: Admin Panel
**Objective**: Comprehensive user and system management.
- [ ] **User Management**:
    - **View Users**: List all registered users with details (Name, Email, Role, Joined Date).
    - **Delete User**: Allow admins to remove users from the system (Auth & DB).
    - **Add User**: Admin-triggered account creation (or clear call-to-action to register).
    - **Role Management**: Promote/Demote users (Member <-> Admin).
- [ ] **System Status**:
    - Display clear indicators of system health (e.g., Database connection).

## Phase 6: User Polish
**Objective**: Secure and personalize.
- [ ] **Profile Settings**:
    - Allow password change.
    - Allow avatar upload (using the `upload` endpoint).
- [ ] **Security**:
    - Ensure all API endpoints verify the `userId` matches the token (Auth middleware).

## "Best Method" Strategy
We will execute this using a **Service-First** approach:
1.  **Backend**: Update a Service (e.g., `GroupService`) to handle the logic (e.g., `generateJoinCode`).
2.  **API**: Expose the endpoint.
3.  **Frontend**: Build the UI component (e.g., `JoinGroupModal`) and connect it.

This ensures logic is robust before mistakes happen in the UI.

---
**Next Step**: Approval to begin **Phase 1: The Circle of Trust**.
