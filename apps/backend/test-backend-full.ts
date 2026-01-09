import axios from 'axios';
import { supabase } from './src/lib/supabase';

const BASE_URL = 'http://localhost:3001';

async function cleanupUser(email: string) {
    // Direct DB cleanup to ensure clean state
    const { data } = await supabase.from('users').select('user_id').eq('email', email).single();
    if (data) {
        // Delete related data first
        await supabase.from('notifications').delete().eq('user_id', data.user_id);
        await supabase.from('friend_requests').delete().or(`from_user_id.eq.${data.user_id},to_user_id.eq.${data.user_id}`);
        await supabase.from('users').delete().eq('user_id', data.user_id);
    }
}

async function createTestUser(name: string, email: string) {
    try {
        // console.log(`Registering ${email}...`);
        const res = await axios.post(`${BASE_URL}/auth/register`, {
            username: name,
            email: email,
            password: 'Password123!'
        });
        return res.data;
    } catch (e: any) {
        if (e.response?.data?.error?.includes('already registered')) {
            // console.log('User already exists, proceeding to login...');
            return;
        }
        console.error(`Failed to register ${name}:`, e.response?.data || e.message);
        throw e;
    }
}

async function loginUser(email: string) {
    try {
        const res = await axios.post(`${BASE_URL}/auth/login`, {
            email: email,
            password: 'Password123!'
        });
        return res.data;
    } catch (e: any) {
        console.error(`Failed to login ${email}:`, e.response?.data || e.message);
        throw e;
    }
}

async function testFriendAndNotification() {
    console.log('--- Testing Friend Request & Notification Flow ---');
    const email1 = `userA_${Date.now()}@test.com`;
    const email2 = `userB_${Date.now()}@test.com`;

    // 1. Create 2 Users & Login
    console.log('1. Creating & Logging in Users...');
    await createTestUser('User A', email1);
    await createTestUser('User B', email2);

    const loginA = await loginUser(email1);
    const tokenA = loginA.token; // AuthService returns { user, token }
    const userIdA = loginA.user.user_id; // AuthService returns { user_id, ... } in user object

    const loginB = await loginUser(email2);
    const tokenB = loginB.token;
    const userIdB = loginB.user.user_id;

    console.log(`   User A: ${userIdA}`);
    console.log(`   User B: ${userIdB}`);

    // 2. User A sends Friend Request to User B
    console.log('2. User A sends Friend Request to User B...');
    try {
        const friendRes = await axios.post(`${BASE_URL}/friends`, {
            userId: userIdA, // The body requires userId mostly for validation or it extracts from token
            friendIdentifier: email2
        }, {
            headers: { Authorization: `Bearer ${tokenA}` }
        });
        console.log('   Friend request sent:', friendRes.data.status);
    } catch (e: any) {
        console.error('   Failed to send friend request:', e.response?.data || e.message);
        throw e;
    }

    // 3. Verify Notification for User B
    console.log('3. Verifying Notification for User B...');
    try {
        const notifyRes = await axios.get(`${BASE_URL}/notifications/${userIdB}`, {
            headers: { Authorization: `Bearer ${tokenB}` }
        });
        const notifications = notifyRes.data;

        // Find notification where sender is User A
        const friendRequestNotif = notifications.find((n: any) =>
            n.type === 'friend_request' &&
            n.metadata?.sender_id === userIdA
        );

        if (friendRequestNotif) {
            console.log('   ✅ Notification Found!');
            console.log('   Title:', friendRequestNotif.title);
            console.log('   Message:', friendRequestNotif.message);
        } else {
            console.error('   ❌ Notification NOT Found!');
            console.log('   All notifications:', JSON.stringify(notifications, null, 2));
        }
    } catch (e: any) {
        console.error('   Failed to fetch notifications:', e.response?.data || e.message);
        throw e;
    }

    // 4. Verify Task Creation
    console.log('4. Verifying Task Creation for User A...');
    try {
        const title = `Task ${Date.now()}`;
        const taskRes = await axios.post(`${BASE_URL}/tasks`, {
            title: title,
            description: 'Test Description',
            created_by: userIdA,
            user_id: userIdA,
            priority: 'medium',
            status: 'todo',
            due_date: new Date().toISOString()
        }, {
            headers: { Authorization: `Bearer ${tokenA}` }
        });

        console.log('   Task created:', taskRes.data.task_id);

        const tasksRes = await axios.get(`${BASE_URL}/tasks?userId=${userIdA}`, {
            headers: { Authorization: `Bearer ${tokenA}` }
        });

        const found = tasksRes.data.find((t: any) => t.title === title);
        if (found) {
            console.log('   ✅ Task Found in list!');
        } else {
            console.error('   ❌ Task NOT Found in list!');
        }

    } catch (e: any) {
        console.error('   Failed to test tasks:', e.response?.data || e.message);
        throw e;
    }

    // Cleanup
    console.log('4. Cleaning up...');
    await cleanupUser(email1);
    await cleanupUser(email2);
    console.log('--- Test Complete ---');
}

async function run() {
    try {
        await testFriendAndNotification();
    } catch (e) {
        console.error('Test Failed', e);
    }
}

run();
