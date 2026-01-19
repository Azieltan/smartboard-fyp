import { Router } from 'express';
import { AdminService } from '../services/admin';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// Middleware to check for admin role
const adminCheck = (req: any, res: any, next: any) => {
  const role = req.user?.role;
  if (role !== 'admin' && role !== 'systemadmin') {
    return res.status(403).json({ error: 'Access denied. Admin role required.' });
  }
  next();
};

// All routes here require auth + admin check
router.use(authMiddleware);
router.use(adminCheck);

// Stats
router.get('/stats', async (req, res) => {
  try {
    const stats = await AdminService.getUserStats();
    res.json(stats);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Users
router.get('/users', async (req, res) => {
  try {
    const users = await AdminService.getAllUsers();
    res.json(users);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/users/:userId/status', async (req, res) => {
  try {
    const { isActive } = req.body;
    await AdminService.toggleUserStatus(req.params.userId, isActive);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/users/:userId', async (req, res) => {
  try {
    await AdminService.deleteUser(req.params.userId);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/export', async (req, res) => {
  try {
    const data = await AdminService.exportData();
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Tasks
router.get('/tasks', async (req, res) => {
  try {
    const tasks = await AdminService.getAllTasks();
    res.json(tasks);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/tasks/:taskId', async (req, res) => {
  try {
    await AdminService.deleteTask(req.params.taskId);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Events
router.get('/events', async (req, res) => {
  try {
    const events = await AdminService.getAllEvents();
    res.json(events);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/events/:eventId', async (req, res) => {
  try {
    await AdminService.deleteEvent(req.params.eventId);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/users', async (req, res) => {
  try {
    const result = await AdminService.createUser(req.body);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
