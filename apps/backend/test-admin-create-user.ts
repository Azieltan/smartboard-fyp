import axios from 'axios';

const API_URL = 'http://localhost:3001';

async function testAdminCreateUser() {
    console.log('╔════════════════════════════════════════════╗');
    console.log('║   Testing Admin Create User Feature       ║');
    console.log('╚════════════════════════════════════════════╝\n');

    try {
        // Note: You need to create an admin account first or use an existing one
        // You can do this by registering a user and manually updating their role in the database

        console.log('⚠️  SETUP REQUIRED:');
        console.log('   1. Make sure you have an admin account');
        console.log('   2. Update the email/password below with your admin credentials\n');

        const ADMIN_EMAIL = 'admin@test.com';  // ← Change this
        const ADMIN_PASSWORD = 'password123';   // ← Change this

        // 1. Login as admin
        console.log('Step 1: Logging in as admin...');
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            email: ADMIN_EMAIL,
            password: ADMIN_PASSWORD
        });

        if (!loginRes.data.token) {
            console.error('❌ Login failed - no token received');
            console.error('   Make sure the admin account exists and credentials are correct');
            return;
        }

        const adminToken = loginRes.data.token;
        const adminUser = loginRes.data.user;
        console.log('✅ Logged in as:', adminUser.user_name);
        console.log('   Role:', adminUser.role);

        if (adminUser.role !== 'admin' && adminUser.role !== 'systemadmin') {
            console.error('❌ User is not an admin! Role:', adminUser.role);
            console.error('   Please update the user role in the database to "admin" or "systemadmin"');
            return;
        }

        // 2. Create a new user via admin portal
        console.log('\nStep 2: Creating new user via admin portal...');
        const newUserEmail = `testuser_${Date.now()}@test.com`;
        const createUserRes = await axios.post(`${API_URL}/admin/users`, {
            name: 'Test User',
            email: newUserEmail,
            password: '', // Leave empty to auto-generate
            role: 'member'
        }, {
            headers: { Authorization: `Bearer ${adminToken}` }
        });

        console.log('✅ User created successfully!');
        console.log('   User ID:', createUserRes.data.user.user_id);
        console.log('   Name:', createUserRes.data.user.user_name);
        console.log('   Email:', createUserRes.data.user.email);
        console.log('   Generated Password:', createUserRes.data.password);
        console.log('   ⚠️  Save this password! It won\'t be shown again.');

        // 3. Verify the user can login
        console.log('\nStep 3: Verifying new user can login...');
        const userLoginRes = await axios.post(`${API_URL}/auth/login`, {
            email: newUserEmail,
            password: createUserRes.data.password
        });

        if (userLoginRes.data.token) {
            console.log('✅ New user can login successfully!');
            console.log('   User:', userLoginRes.data.user.user_name);
        } else {
            console.error('❌ New user login failed');
        }

        console.log('\n╔════════════════════════════════════════════╗');
        console.log('║         ✅ ALL TESTS PASSED!               ║');
        console.log('╚════════════════════════════════════════════╝\n');

    } catch (error: any) {
        console.error('\n❌ TEST FAILED');
        console.error('Error:', error.response?.data?.error || error.message);

        if (error.response?.status === 403) {
            console.error('\n💡 Tip: Make sure you\'re logged in as an admin');
        } else if (error.response?.status === 401) {
            console.error('\n💡 Tip: Check your admin credentials');
        }
    }
}

testAdminCreateUser();
