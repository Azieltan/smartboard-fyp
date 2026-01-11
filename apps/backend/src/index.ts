import express from 'express';
import { createServer } from 'http';
import { Server, Socket } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { User } from '@smartboard/home';
import { N8NService } from './services/n8n';
import { AuthService } from './services/auth';
import { authMiddleware } from './middleware/auth';
import { supabase } from './lib/supabase';
import { TaskService } from './services/task';
import { FriendService } from './services/friend';
import { CalendarService } from './services/calendar';
import { NotificationService } from './services/notification';
import { SmartyService } from './services/smarty';
import { AdminService } from './services/admin';
import smartyRouter from './routes/smarty';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: '*', // Allow all origins for now
        methods: ['GET', 'POST']
    }
});
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// Socket.IO Connection Handler
io.on('connection', (socket: Socket) => {
    console.log('User connected:', socket.id);

    socket.on('join_room', (roomId: string) => {
        socket.join(roomId);
        console.log(`User ${socket.id} joined room ${roomId}`);
    });

    socket.on('leave_room', (roomId: string) => {
        socket.leave(roomId);
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

// Initialize NotificationService with socket.io for real-time notifications
NotificationService.setIO(io);

app.get('/', (req, res) => {
    res.send('SmartBoard API is running');
});

app.post('/test-n8n', async (req, res) => {
    try {
        const result = await N8NService.triggerReminder('test-user', 'test-task', 'This is a test reminder');
        res.json({ success: true, result });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to trigger N8N' });
    }
});

app.get('/test-shared', (req, res) => {
    const user: User = {
        user_id: 'test-uid',
        username: 'Test User',
        email: 'test@example.com',
        role: 'member'
    };
    res.json(user);
});

// Smarty Routes
app.use('/smarty', smartyRouter);

// Auth Routes
app.post('/auth/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;
        const user = await AuthService.register(username, email, password);
        res.json(user);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

app.post('/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const result = await AuthService.login(email, password);
        res.json(result);
    } catch (error: any) {
        res.status(401).json({ error: error.message });
    }
});

app.get('/users/search', async (req, res) => {
    try {
        const query = req.query.query as string;
        if (!query) return res.json([]);
        const users = await AuthService.searchUser(query);
        res.json(users);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/users', async (req, res) => {
    try {
        const users = await AuthService.getAllUsers();
        res.json(users);
    } catch (error: any) {
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

app.put('/users/:userId', async (req, res) => {
    try {
        const { user_name } = req.body;
        // Use user_name key to match DB column
        const user = await AuthService.updateUser(req.params.userId, { user_name } as any);
        res.json(user);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/auth/change-password', async (req, res) => {
    try {
        const { userId, currentPassword, newPassword } = req.body;
        await AuthService.changePassword(userId, currentPassword, newPassword);
        res.json({ success: true, message: 'Password changed successfully' });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});



import { seedDatabase } from './seed';

app.post('/seed', async (req, res) => {
    try {
        const result = await seedDatabase();
        res.json(result);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Apply Auth Middleware to all subsequent routes
app.use(authMiddleware);



import { GroupService } from './services/group';
import { ChatService } from './services/chat';

// Group Routes
app.post('/groups', async (req, res) => {
    try {
        const { name, ownerId, requiresApproval, friendIds, friendRoles } = req.body;
        const group = await GroupService.createGroup(name, ownerId, requiresApproval, friendIds || [], friendRoles || {});
        // Automatically create a chat for the group
        await ChatService.createChat(group.group_id);
        res.json(group);
    } catch (error: any) {
        res.status(500).json({ error: error.message || 'Failed to create group' });
    }
});

app.post('/groups/join', async (req, res) => {
    try {
        const { code, userId } = req.body;
        const result = await GroupService.joinGroupRaw(code, userId);
        res.json(result);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

app.post('/groups/:groupId/invite', async (req, res) => {
    try {
        const { targetUserId, requesterId } = req.body;
        await GroupService.inviteUser(req.params.groupId, targetUserId, requesterId);
        res.json({ success: true });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

app.put('/groups/:groupId', async (req, res) => {
    try {
        // Expecting requesterId in body (or from auth middleware if stricter)
        // For now, assuming body contains it as passed by frontend api call wrapper
        // But better to use req.user.userId if auth middleware populates it.
        // Frontend currently passes data.
        // Let's rely on body for now to match current pattern, or use req.user if available.
        // The service requires requesterId to verify ownership.

        // Frontend might not be sending requesterId in the body of the PUT for updateGroup yet?
        // Let's check GroupInfoModal usage:
        // await api.put(`/groups/${groupId}`, { name, description }); 
        // It does NOT send requesterId explicitly in the body in the current code (I need to fix that in frontend too).
        // However, authMiddleware populates req.user.

        const requesterId = (req as any).user?.userId; // Assuming auth middleware
        const { name, description, requires_approval } = req.body;

        const group = await GroupService.updateGroup(req.params.groupId, {
            name,
            description,
            requires_approval,
            requesterId
        });
        res.json(group);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

app.get('/groups/:userId', async (req, res) => {
    try {
        const groups = await GroupService.getUserGroups(req.params.userId);
        res.json(groups);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch user groups' });
    }
});

app.post('/groups/:groupId/members', async (req, res) => {
    try {
        const { userId, role } = req.body;
        const member = await GroupService.addMember(req.params.groupId, userId, role);
        res.json(member);
    } catch (error) {
        res.status(500).json({ error: 'Failed to add member' });
    }
});

app.get('/groups/:groupId/pending', async (req, res) => {
    try {
        const members = await GroupService.getPendingMembers(req.params.groupId);
        res.json(members);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/groups/:groupId/members/:userId', async (req, res) => {
    try {
        const { status } = req.body;
        await GroupService.updateMemberStatus(req.params.groupId, req.params.userId, status);
        res.json({ success: true });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Get all members of a group
app.get('/groups/:groupId/members', async (req, res) => {
    try {
        const members = await GroupService.getGroupMembers(req.params.groupId);
        res.json(members);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Remove a member from group
app.delete('/groups/:groupId/members/:targetUserId', async (req, res) => {
    try {
        const { requesterId } = req.body;
        await GroupService.removeMember(req.params.groupId, req.params.targetUserId, requesterId);
        res.json({ success: true });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

// Update member role
app.put('/groups/:groupId/members/:targetUserId/role', async (req, res) => {
    try {
        const { newRole, requesterId } = req.body;
        await GroupService.updateMemberRole(req.params.groupId, req.params.targetUserId, newRole, requesterId);
        res.json({ success: true });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

// Toggle admin permission (by owner)
app.put('/groups/:groupId/members/:adminUserId/permission', async (req, res) => {
    try {
        const { canManage, ownerId } = req.body;
        await GroupService.toggleAdminPermission(req.params.groupId, req.params.adminUserId, canManage, ownerId);
        res.json({ success: true });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

// Update member status (Approve/Reject)
app.put('/groups/:groupId/members/:userId/status', async (req, res) => {
    try {
        const { status } = req.body; // 'active' or 'rejected'
        if (status !== 'active' && status !== 'rejected') {
            return res.status(400).json({ error: 'Invalid status' });
        }
        await GroupService.updateMemberStatus(req.params.groupId, req.params.userId, status);
        res.json({ success: true });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Join group via code
app.post('/groups/join', async (req, res) => {
    try {
        const { code, userId } = req.body;
        const result = await GroupService.joinGroupRaw(code, userId);
        res.json(result);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

app.post('/groups/:groupId/leave', async (req, res) => {
    try {
        const { userId } = req.body;
        if (!userId) return res.status(400).json({ error: 'UserID required' });
        await GroupService.leaveGroup(req.params.groupId, userId);
        res.json({ success: true });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

// Regenerate join code
app.post('/groups/:groupId/regenerate-code', async (req, res) => {
    try {
        const { requesterId } = req.body;
        const newCode = await GroupService.regenerateJoinCode(req.params.groupId, requesterId);
        res.json({ success: true, join_code: newCode });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

// Get group details
app.get('/groups/detail/:groupId', async (req, res) => {
    try {
        const group = await GroupService.getGroup(req.params.groupId);
        res.json(group);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

import multer from 'multer';
const upload = multer({ storage: multer.memoryStorage() });

app.post('/upload', upload.single('file'), async (req, res) => {
    try {
        console.log('[Upload] Received upload request');
        if (!req.file) {
            console.error('[Upload] No file received');
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const file = req.file;
        console.log(`[Upload] Processing file: ${file.originalname} (${file.mimetype}, ${file.size} bytes)`);

        const fileExt = file.originalname.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `${fileName}`;

        // Ensure bucket exists
        const BUCKET_NAME = 'chat-attachments';
        const { data: bucketData, error: bucketError } = await supabase.storage.getBucket(BUCKET_NAME);

        if (bucketError && bucketError.message.includes('not found')) {
            console.log(`[Upload] Bucket '${BUCKET_NAME}' not found. Creating...`);
            const { error: createError } = await supabase.storage.createBucket(BUCKET_NAME, {
                public: true,
                fileSizeLimit: 10485760, // 10MB
                allowedMimeTypes: undefined // Allow all
            });
            if (createError) {
                console.error('[Upload] Failed to create bucket:', createError);
                throw new Error(`Failed to create storage bucket: ${createError.message}`);
            }
            console.log(`[Upload] Bucket '${BUCKET_NAME}' created.`);
        } else if (bucketError) {
            // Ignore other errors (like permission denied which shouldn't happen with service key, but just in case)
            console.warn('[Upload] Check bucket warning:', bucketError);
        }

        const { data, error } = await supabase.storage
            .from(BUCKET_NAME)
            .upload(filePath, file.buffer, {
                contentType: file.mimetype,
                upsert: false
            });

        if (error) {
            console.error('[Upload] Supabase upload error:', error);
            throw error;
        }

        const { data: { publicUrl } } = supabase.storage
            .from(BUCKET_NAME)
            .getPublicUrl(filePath);

        console.log(`[Upload] Success: ${publicUrl}`);
        res.json({ url: publicUrl, type: file.mimetype });
    } catch (error: any) {
        console.error('[Upload] Internal server error:', error);
        res.status(500).json({ error: error.message || 'Failed to upload file' });
    }
});

// DM Route
app.post('/chats/dm', async (req, res) => {
    try {
        const { user1Id, user2Id } = req.body;
        // 1. Get/Create the underlying "Group" for this DM
        const groupId = await GroupService.getOrCreateDirectChat(user1Id, user2Id);

        // 2. Ensure Chat exists for this Group
        let chat = await ChatService.getChatByGroupId(groupId);
        if (!chat) {
            chat = await ChatService.createChat(groupId);
        }

        res.json({ groupId, chatId: chat.chat_id });
    } catch (error) {
        console.error('DM Error:', error);
        res.status(500).json({ error: 'Failed to create DM' });
    }
});

// Chat Routes
app.get('/chats/group/:groupId', async (req, res) => {
    try {
        const chat = await ChatService.getChatByGroupId(req.params.groupId);
        if (!chat) {
            // Create if not exists? Or just 404. 
            // Logic in messages route creates it. Let's create it here too or just return 404.
            // Better to just return 404 and let the UI handle or auto-create.
            // Actually, for robust chat, we should ensure it exists.
            // But let's stick to simple retrieval.
            return res.status(404).json({ error: 'Chat not found' });
        }
        res.json(chat);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch chat info' });
    }
});

app.get('/chats/:groupId/messages', async (req, res) => {
    try {
        console.log(`Fetching messages for group: ${req.params.groupId}`);
        const chat = await ChatService.getChatByGroupId(req.params.groupId);
        if (!chat) {
            console.log('No chat found for group');
            return res.json([]);
        }
        console.log(`Found chat: ${chat.chat_id}`);
        const messages = await ChatService.getMessages(chat.chat_id);
        console.log(`Found ${messages.length} messages`);
        res.json(messages);
    } catch (error) {
        console.error('Error fetching messages:', error);
        res.status(500).json({ error: 'Failed to fetch messages' });
    }
});

app.post('/chats/:groupId/messages', async (req, res) => {
    try {
        const { userId, content } = req.body;

        if (!userId || !content) {
            return res.status(400).json({ error: 'userId and content are required' });
        }

        let chat = await ChatService.getChatByGroupId(req.params.groupId);

        if (!chat) {
            chat = await ChatService.createChat(req.params.groupId);
        }

        const message = await ChatService.sendMessage(chat.chat_id, userId, content);

        // Emit real-time event to the groupId room
        io.to(req.params.groupId).emit('new_message', message);

        res.json(message);
    } catch (error: any) {
        console.error(`Error sending message to group ${req.params.groupId}:`, error);
        res.status(500).json({ error: error.message || 'Failed to send message' });
    }
});

// Friend Routes

// Friend Routes
app.post('/friends', async (req, res) => {
    try {
        const { userId, friendIdentifier } = req.body;
        const friend = await FriendService.addFriend(userId, friendIdentifier);
        res.json(friend);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

app.get('/friends/:userId', async (req, res) => {
    try {
        const friends = await FriendService.getFriends(req.params.userId);
        res.json(friends);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/friends/:id/accept', async (req, res) => {
    try {
        await FriendService.acceptFriend(req.params.id);
        res.json({ success: true });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/friends/:id', async (req, res) => {
    try {
        await FriendService.removeFriend(req.params.id);
        res.json({ success: true });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/friends/:id/reject', async (req, res) => {
    try {
        await FriendService.rejectFriend(req.params.id);
        res.json({ success: true });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});


// Calendar Routes
app.post('/calendar', async (req, res) => {
    try {
        const event = await CalendarService.createEvent(req.body);
        res.json(event);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create event' });
    }
});

app.get('/calendar/:userId', async (req, res) => {
    try {
        const events = await CalendarService.getEvents(req.params.userId);
        res.json(events);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch events' });
    }
});

app.get('/calendar/:userId/items', async (req, res) => {
    try {
        const items = await CalendarService.getAllCalendarItems(req.params.userId);
        res.json(items);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/calendar/all/:userId', async (req, res) => {
    try {
        const items = await CalendarService.getAllCalendarItems(req.params.userId);
        res.json(items);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch calendar items' });
    }
});

// Task Routes

// Task Routes
app.get('/tasks', async (req, res) => {
    try {
        const userId = req.query.userId as string;
        const tasks = await TaskService.getAllTasks(userId);
        res.json(tasks);
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

app.post('/tasks', async (req, res) => {
    try {
        const task = await TaskService.createTask(req.body);
        res.json(task);
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

app.put('/tasks/:id', async (req, res) => {
    try {
        const task = await TaskService.updateTask(req.params.id, req.body);
        res.json(task);
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

app.get('/tasks/:taskId', async (req, res) => {
    try {
        const task = await TaskService.getTaskWithSubtasks(req.params.taskId);
        res.json(task);
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

app.post('/tasks/:taskId/subtasks', async (req, res) => {
    try {
        const subtask = await TaskService.addSubtask(req.params.taskId, req.body.title, req.body.description);
        res.json(subtask);
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

app.put('/tasks/subtasks/:subtaskId', async (req, res) => {
    try {
        const { isCompleted, title } = req.body;
        // Check what we are updating
        let subtask;
        if (title !== undefined) {
            subtask = await TaskService.updateSubtaskTitle(req.params.subtaskId, title);
        } else if (isCompleted !== undefined) {
            subtask = await TaskService.toggleSubtask(req.params.subtaskId, isCompleted);
        } else {
            return res.status(400).json({ error: "Nothing to update" });
        }
        res.json(subtask);
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

// Multer already imported above

app.post('/tasks/subtasks/:subtaskId/attachments', upload.single('file'), async (req: any, res) => {
    try {
        const file = req.file;
        if (!file) return res.status(400).json({ error: 'No file uploaded' });

        // Upload to Supabase Storage
        const fileName = `${req.params.subtaskId}/${Date.now()}_${file.originalname}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
            .from('attachments') // Ensure this bucket exists
            .upload(fileName, file.buffer, {
                contentType: file.mimetype,
                upsert: false
            });

        if (uploadError) throw new Error(uploadError.message);

        // Get Public URL
        const { data: { publicUrl } } = supabase.storage
            .from('attachments')
            .getPublicUrl(fileName);

        const subtask = await TaskService.addSubtaskAttachment(req.params.subtaskId, publicUrl);
        res.json(subtask);
    } catch (e: any) {
        console.error("Subtask upload error:", e);
        res.status(500).json({ error: e.message });
    }
});

app.post('/tasks/:taskId/submit', async (req, res) => {
    try {
        const { userId, content, attachments } = req.body;
        const submission = await TaskService.submitTask(req.params.taskId, userId, content, attachments);
        res.json(submission);
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

app.get('/tasks/:taskId/submission', async (req, res) => {
    try {
        const submission = await TaskService.getTaskSubmission(req.params.taskId);
        // Better to return 200 with null than 404 which can cause confusion if handled strictly
        res.json(submission || null);
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

app.get('/tasks/:taskId/submissions', async (req, res) => {
    try {
        console.log(`Fetching submissions for task: ${req.params.taskId}`);
        const submissions = await TaskService.getTaskSubmissions(req.params.taskId);
        console.log(`Found ${submissions.length} submissions`);
        res.json(submissions);
    } catch (e: any) {
        console.error("Error in GET /tasks/:taskId/submissions:", e);
        res.status(500).json({ error: e.message });
    }
});


app.put('/tasks/submissions/:submissionId/review', async (req, res) => {
    try {
        const { status, feedback } = req.body;
        const submission = await TaskService.reviewSubmission(req.params.submissionId, status, feedback);
        res.json(submission);
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

// Notification Routes
// Notification Routes
app.get('/notifications/:userId', async (req, res) => {
    try {
        const notifications = await NotificationService.getUnreadNotifications(req.params.userId);
        res.json(notifications);
    } catch (error: any) {
        console.error(`Error fetching notifications for user ${req.params.userId}:`, error);
        res.status(500).json({ error: error.message || "Internal Server Error", details: error });
    }
});

app.put('/notifications/:notificationId/read', async (req, res) => {
    try {
        await NotificationService.markAsRead(req.params.notificationId);
        res.json({ success: true });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/notifications/:userId/read-all', async (req, res) => {
    try {
        await NotificationService.markAllAsRead(req.params.userId);
        res.json({ success: true });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/notifications/:notificationId', async (req, res) => {
    try {
        await NotificationService.deleteNotification(req.params.notificationId);
        res.json({ success: true });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});








// Admin Routes
const adminMiddleware = (req: any, res: any, next: any) => {
    if (req.user?.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
    }
    next();
};

app.get('/admin/stats', adminMiddleware, async (req, res) => {
    try {
        const stats = await AdminService.getUserStats();
        res.json(stats);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/admin/users', adminMiddleware, async (req, res) => {
    try {
        const users = await AdminService.getAllUsers();
        res.json(users);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/admin/users/:userId', adminMiddleware, async (req, res) => {
    try {
        await AdminService.deleteUser(req.params.userId);
        io.to(req.params.userId).emit('force_logout', 'Your account has been deleted by the administrator.');
        res.json({ success: true });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/admin/users/:userId/status', adminMiddleware, async (req, res) => {
    try {
        const { isActive } = req.body;
        await AdminService.toggleUserStatus(req.params.userId, isActive);

        if (!isActive) {
            io.to(req.params.userId).emit('force_logout', 'Your account has been deactivated by the administrator.');
        }

        res.json({ success: true });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/admin/tasks', adminMiddleware, async (req, res) => {
    try {
        const tasks = await AdminService.getAllTasks();
        res.json(tasks);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/admin/tasks/:taskId', adminMiddleware, async (req, res) => {
    try {
        const task = await AdminService.updateTask(req.params.taskId, req.body);
        res.json(task);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/admin/tasks/:taskId', adminMiddleware, async (req, res) => {
    try {
        await AdminService.deleteTask(req.params.taskId);
        res.json({ success: true });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/admin/events', adminMiddleware, async (req, res) => {
    try {
        const events = await AdminService.getAllEvents();
        res.json(events);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/admin/events/:eventId', adminMiddleware, async (req, res) => {
    try {
        const event = await AdminService.updateEvent(req.params.eventId, req.body);
        res.json(event);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/admin/events/:eventId', adminMiddleware, async (req, res) => {
    try {
        await AdminService.deleteEvent(req.params.eventId);
        res.json({ success: true });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/admin/export', adminMiddleware, async (req, res) => {
    try {
        const data = await AdminService.exportData();
        res.json(data);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

httpServer.listen(port, () => {

    console.log(`Server running on port ${port}`);
});
