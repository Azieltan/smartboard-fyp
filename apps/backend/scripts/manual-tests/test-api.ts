import axios from 'axios';

const API_URL = 'http://localhost:3001';

async function runTests() {
    try {
        // 1. Register User A (Owner)
        const emailA = `owner_${Date.now()}@test.com`;
        console.log(`Creating Owner: ${emailA}`);
        const resA = await axios.post(`${API_URL}/auth/register`, {
            username: 'Owner',
            email: emailA,
            password: 'password123'
        });
        const tokenA = resA.data.token;
        const userAId = resA.data.user.user_id;

        // 2. Register User B (Invitee)
        const emailB = `invitee_${Date.now()}@test.com`;
        console.log(`Creating Invitee: ${emailB}`);
        const resB = await axios.post(`${API_URL}/auth/register`, {
            username: 'Invitee',
            email: emailB,
            password: 'password123'
        });
        const tokenB = resB.data.token;
        const userBId = resB.data.user.user_id;

        // 3. Create Group by Owner
        console.log('Creating Group...');
        const resGroup = await axios.post(`${API_URL}/groups`, {
            name: 'Test Group',
            ownerId: userAId,
            requiresApproval: false
        }, { headers: { Authorization: `Bearer ${tokenA}` } });
        const groupId = resGroup.data.group_id;
        console.log(`Group Created: ${groupId}`);

        // 4. Invite User B to Group
        console.log(`Inviting User B (${userBId}) to Group (${groupId})...`);
        const resInvite = await axios.post(`${API_URL}/groups/${groupId}/invite`, {
            targetUserId: userBId,
            requesterId: userAId
        }, { headers: { Authorization: `Bearer ${tokenA}` } });
        console.log('Invite Response:', resInvite.data);

        // 5. Check User B's invitations
        console.log('Checking User B invitations...');
        const resInvitations = await axios.get(`${API_URL}/groups/${userBId}/invitations`, {
            headers: { Authorization: `Bearer ${tokenB}` }
        });
        console.log('Invitations:', resInvitations.data);

        if (resInvitations.data.length > 0 && resInvitations.data[0].group_id === groupId) {
            console.log('SUCCESS: Invitation found!');
        } else {
            console.error('FAILURE: Invitation not found.');
        }

    } catch (error: any) {
        console.error('Test Failed:', error.response?.data || error.message);
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Headers:', error.response.headers);
        } else {
            console.error('Full Error:', error);
        }
    }
}

runTests();
