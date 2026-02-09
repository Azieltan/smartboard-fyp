import axios from 'axios';

const API_URL = 'http://localhost:3001';

async function testBackendHealth() {
    console.log('Testing backend health...\n');

    try {
        // Test 1: Root endpoint
        console.log('1. Testing root endpoint...');
        const rootRes = await axios.get(`${API_URL}/`);
        console.log('✅ Root endpoint:', rootRes.data);

        // Test 2: Register a test user
        console.log('\n2. Registering test user...');
        const email = `test_${Date.now()}@test.com`;
        const registerRes = await axios.post(`${API_URL}/auth/register`, {
            username: 'Test User',
            email: email,
            password: 'password123'
        });
        console.log('✅ User registered');
        const token = registerRes.data.token;
        const userId = registerRes.data.user.user_id;

        // Test 3: Get notifications
        console.log('\n3. Testing notifications endpoint...');
        const notifRes = await axios.get(`${API_URL}/notifications/${userId}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('✅ Notifications endpoint working');
        console.log('   Notifications count:', notifRes.data.length);

        console.log('\n✅ Backend is healthy!');

    } catch (error: any) {
        console.error('\n❌ Backend test failed');
        console.error('Error:', error.response?.data || error.message);
        console.error('Status:', error.response?.status);

        if (error.code === 'ECONNREFUSED') {
            console.error('\n💡 Backend is not running! Please start it with: npm run dev');
        }
    }
}

testBackendHealth();
