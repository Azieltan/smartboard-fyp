import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { User } from '@smartboard/home';
import { N8NService } from './services/n8n';
import { AuthService } from './services/auth';
import { authMiddleware } from './middleware/auth';
import { supabase } from './lib/supabase';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

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
import { SmartyService } from './services/smarty';

app.post('/smarty/automate', async (req, res) => {
    try {
        const { userId, prompt } = req.body;
        const result = await SmartyService.automate(userId, prompt);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: 'Failed to process automation request' });
    }
});

app.post('/smarty/ask', async (req, res) => {
    try {
        const { userId, question } = req.body;
        const result = await SmartyService.ask(userId, question);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: 'Failed to process question' });
    }
});

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
        const user = await AuthService.updateUser(req.params.userId, { username: user_name } as any); // Mapping username to user_name if needed, or just passing body
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

import { TaskService } from './services/task';

app.get('/tasks', async (req, res) => {
    try {
        const userId = req.query.userId as string;
        const tasks = await TaskService.getAllTasks(userId);
        res.json(tasks);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch tasks' });
    }
});

app.post('/tasks', async (req, res) => {
    try {
        const task = await TaskService.createTask(req.body);
        res.json(task);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create task' });
    }
});

import { GroupService } from './services/group';
import { ChatService } from './services/chat';

// Group Routes
app.post('/groups', async (req, res) => {
    try {
        const { name, ownerId } = req.body;
        const group = await GroupService.createGroup(name, ownerId);
        // Automatically create a chat for the group
        await ChatService.createChat(group.group_id);
        res.json(group);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create group' });
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

import multer from 'multer';
const upload = multer({ storage: multer.memoryStorage() });

app.post('/upload', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const file = req.file;
        const fileExt = file.originalname.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { data, error } = await supabase.storage
            .from('chat-attachments')
            .upload(filePath, file.buffer, {
                contentType: file.mimetype,
                upsert: false
            });

        if (error) {
            throw error;
        }

        const { data: { publicUrl } } = supabase.storage
            .from('chat-attachments')
            .getPublicUrl(filePath);

        res.json({ url: publicUrl, type: file.mimetype });
    } catch (error: any) {
        console.error('Upload error:', error);
        res.status(500).json({ error: 'Failed to upload file' });
    }
});

// Chat Routes
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
        let chat = await ChatService.getChatByGroupId(req.params.groupId);

        if (!chat) {
            chat = await ChatService.createChat(req.params.groupId);
        }

        const message = await ChatService.sendMessage(chat.chat_id, userId, content);
        res.json(message);
    } catch (error) {
        res.status(500).json({ error: 'Failed to send message' });
    }
});

import { FriendService } from './services/friend';
import { CalendarService } from './services/calendar';

// Friend Routes
app.post('/friends', async (req, res) => {
    try {
        const { userId, friendIdentifier } = req.body;
        const friend = await FriendService.addFriend(userId, friendIdentifier);
        res.json(friend);
    } catch (error) {
        res.status(500).json({ error: 'Failed to add friend' });
    }
});

app.get('/friends/:userId', async (req, res) => {
    try {
        const friends = await FriendService.getFriends(req.params.userId);
        res.json(friends);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch friends' });
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

app.get('/calendar/all/:userId', async (req, res) => {
    try {
        const items = await CalendarService.getAllCalendarItems(req.params.userId);
        res.json(items);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch calendar items' });
    }
});







app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
