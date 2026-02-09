import axios from 'axios';

const API_URL = 'http://localhost:3001';

async function testAdminCreateUser() {
    console.log('\n=== TEST 1: Admin Create User ===\n');

    try {
        // 1. Login as admin (you'll need to have an admin account)
        console.log('Step 1: Login as admin...');
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            email: 'admin@test.com', // Replace with your admin email
            password: 'password123'   // Replace with your admin password
        });

        if (!loginRes.data.token) {
            console.error('❌ Login failed - no token received');
            return;
        }

        const adminToken = loginRes.data.token;
        console.log('✅ Admin logged in successfully');

        // 2. Create a new user via admin portal
        console.log('\nStep 2: Creating new user via admin portal...');
        const newUserEmail = `testuser_${Date.now()}@test.com`;
        const createUserRes = await axios.post(`${API_URL}/admin/users`, {
            name: 'Test User',
            email: newUserEmail,
            password: '', // Auto-generate
            role: 'member'
        }, {
            headers: { Authorization: `Bearer ${adminToken}` }
        });

        console.log('✅ User created successfully!');
        console.log('   User ID:', createUserRes.data.user.user_id);
        console.log('   Generated Password:', createUserRes.data.password);
        console.log('   Email:', newUserEmail);

        // 3. Verify the user can login
        console.log('\nStep 3: Verifying new user can login...');
        const userLoginRes = await axios.post(`${API_URL}/auth/login`, {
            email: newUserEmail,
            password: createUserRes.data.password
        });

        if (userLoginRes.data.token) {
            console.log('✅ New user can login successfully!');
        } else {
            console.error('❌ New user login failed');
        }

    } catch (error: any) {
        console.error('❌ Test failed:', error.response?.data || error.message);
    }
}

async function testInvitationSystem() {
    console.log('\n\n=== TEST 2: Group Invitation System ===\n');

    try {
        // 1. Create Owner
        const emailA = `owner_${Date.now()}@test.com`;
        console.log(`Step 1: Creating Owner (${emailA})...`);
        const resA = await axios.post(`${API_URL}/auth/register`, {
            username: 'Group Owner',
            email: emailA,
            password: 'password123'
        });
        const tokenA = resA.data.token;
        const userAId = resA.data.user.user_id;
        console.log('✅ Owner created');

        // 2. Create Invitee
        const emailB = `invitee_${Date.now()}@test.com`;
        console.log(`\nStep 2: Creating Invitee (${emailB})...`);
        const resB = await axios.post(`${API_URL}/auth/register`, {
            username: 'Invitee User',
            email: emailB,
            password: 'password123'
        });
        const tokenB = resB.data.token;
        const userBId = resB.data.user.user_id;
        console.log('✅ Invitee created');

        // 3. Create Group
        console.log('\nStep 3: Creating Group...');
        const resGroup = await axios.post(`${API_URL}/groups`, {
            name: 'Test Invitation Group',
            ownerId: userAId,
            requiresApproval: false
        }, { headers: { Authorization: `Bearer ${tokenA}` } });
        const groupId = resGroup.data.group_id;
        console.log(`✅ Group created: ${groupId}`);

        // 4. Send Invitation
        console.log(`\nStep 4: Sending invitation to User B...`);
        await axios.post(`${API_URL}/groups/${groupId}/invite`, {
            targetUserId: userBId,
            requesterId: userAId
        }, { headers: { Authorization: `Bearer ${tokenA}` } });
        console.log('✅ Invitation sent');

        // 5. Check User B's invitations
        console.log('\nStep 5: Checking User B\'s invitations...');
        const resInvitations = await axios.get(`${API_URL}/groups/${userBId}/invitations`, {
            headers: { Authorization: `Bearer ${tokenB}` }
        });

        if (resInvitations.data.length > 0) {
            console.log('✅ Invitation received!');
            console.log('   Group:', resInvitations.data[0].groups.name);
            console.log('   Status:', resInvitations.data[0].status);
        } else {
            console.error('❌ No invitations found');
            return;
        }

        // 6. Accept Invitation
        console.log('\nStep 6: Accepting invitation...');
        await axios.put(`${API_URL}/groups/${groupId}/invitations/accept`, {
            userId: userBId
        }, { headers: { Authorization: `Bearer ${tokenB}` } });
        console.log('✅ Invitation accepted');

        // 7. Verify User B is now a member
        console.log('\nStep 7: Verifying membership...');
        const resMembers = await axios.get(`${API_URL}/groups/${groupId}/members`, {
            headers: { Authorization: `Bearer ${tokenA}` }
        });

        const isMember = resMembers.data.some((m: any) => m.user_id === userBId && m.status === 'active');
        if (isMember) {
            console.log('✅ User B is now an active member!');
        } else {
            console.error('❌ User B is not an active member');
        }

        console.log('\n✅ ALL INVITATION TESTS PASSED!');

    } catch (error: any) {
        console.error('❌ Test failed:', error.response?.data || error.message);
    }
}

async function runAllTests() {
    console.log('╔════════════════════════════════════════════╗');
    console.log('║   SmartBoard System Integration Tests     ║');
    console.log('╚════════════════════════════════════════════╝');

    await testAdminCreateUser();
    await testInvitationSystem();

    console.log('\n\n╔════════════════════════════════════════════╗');
    console.log('║          All Tests Completed!              ║');
    console.log('╚════════════════════════════════════════════╝\n');
}

runAllTests();
