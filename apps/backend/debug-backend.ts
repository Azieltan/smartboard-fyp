
import dotenv from 'dotenv';
dotenv.config();

import { supabase } from './src/lib/supabase';
import { TaskService } from './src/services/task';
import { NotificationService } from './src/services/notification';
import { AuthService } from './src/services/auth';

async function run() {
    console.log('--- Debugging Backend ---');
    console.log('JWT_SECRET present:', !!process.env.JWT_SECRET);
    if (process.env.JWT_SECRET) {
        console.log('JWT_SECRET length:', process.env.JWT_SECRET.length);
    } else {
        console.log('Using default "your-secret-key"');
    }

    // 1. List Users
    console.log('\n--- Listing Users ---');
    try {
        const users = await AuthService.getAllUsers();
        console.log(`Found ${users.length} users.`);
        users.forEach((u: any) => console.log(` - [${u.user_id}] ${u.email} (${u.user_name || u.username})`));

        if (users.length > 0) {
            const testUser = users[0];
            const userId = testUser.user_id;
            console.log(`\n--- Testing Data Access for User: ${userId} (${testUser.email}) ---`);

            // 2. Test Notifications
            console.log('Fetching Notifications...');
            try {
                const notes = await NotificationService.getUnreadNotifications(userId);
                console.log(`Success! Found ${notes.length} unread notifications.`);
            } catch (e: any) {
                console.error('FAILED to fetch notifications:', e.message);
                console.error(e);
            }

            // 3. Test Tasks
            console.log('Fetching Tasks...');
            try {
                const tasks = await TaskService.getAllTasks(userId);
                console.log(`Success! Found ${tasks.length} tasks.`);
            } catch (e: any) {
                console.error('FAILED to fetch tasks:', e.message);
                console.error(e);
            }
        } else {
            console.warn('NO USERS FOUND! This explains why login fails or tokens are invalid (if using old tokens).');
        }

    } catch (e: any) {
        console.error('Failed to list users:', e.message);
    }
}

run().catch(console.error);
