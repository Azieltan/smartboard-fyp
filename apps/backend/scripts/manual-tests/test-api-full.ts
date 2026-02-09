
import axios from 'axios';

const API_URL = 'http://localhost:3001';

async function run() {
    try {
        const timestamp = Date.now();
        const email = `api_test_${timestamp}@example.com`;
        const password = 'password123';

        console.log('1. Registering...');
        const regRes = await axios.post(`${API_URL}/auth/register`, {
            username: 'API Test User',
            email,
            password
        });
        const userId = regRes.data.user_id;
        console.log('   Registered:', userId);

        console.log('2. Logging in...');
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            email,
            password
        });
        const token = loginRes.data.token;
        console.log('   Logged in. Token length:', token.length);

        console.log('3. Fetching Tasks (Protected Route)...');
        const tasksRes = await axios.get(`${API_URL}/tasks?userId=${userId}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('   Tasks fetched successfully. Count:', tasksRes.data.length);

        console.log('4. Fetching Notifications (Protected Route)...');
        const notesRes = await axios.get(`${API_URL}/notifications/${userId}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('   Notifications fetched. Count:', notesRes.data.length);

        console.log('✅ FULL HTTP TEST PASSED!');

    } catch (error: any) {
        console.error('❌ TEST FAILED');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
        } else {
            console.error(error.message);
        }
    }
}

run();
