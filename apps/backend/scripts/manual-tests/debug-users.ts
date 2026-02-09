
import { supabase } from '../../src/lib/supabase';

async function checkPendingUsersExistence() {
    console.log('--- Checking Pending Users Existence in Public Table ---');

    const pendingUserIds = [
        '717f8b9e-e366-4748-99ea-c6d5dfdd9eb0',
        '6850142c-b100-4b3d-a82e-21a8ae955a54',
        '46d5ef11-6d6a-4fe3-adfc-de8ae12a018b'
    ];

    const { data: users, error } = await supabase
        .from('users')
        .select('user_id, user_name')
        .in('user_id', pendingUserIds);

    if (error) {
        console.error('Error fetching users:', error);
        return;
    }

    console.log(`Looking for ${pendingUserIds.length} pending users.`);
    console.log(`Found ${users.length} matching records in 'users' table.`);

    users.forEach(u => console.log(` - Found: ${u.user_name} (${u.user_id})`));

    if (users.length < pendingUserIds.length) {
        console.log('VIOLATION: Some pending code references users that do NOT exist in the public users table!');
        console.log('This will cause the INNER JOIN to fail and hide the requests.');
    } else {
        console.log('All pending users exist. INNER JOIN should work.');
    }
}

checkPendingUsersExistence().catch(console.error);
