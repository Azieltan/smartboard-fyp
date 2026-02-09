
import { supabase } from '../../src/lib/supabase';

async function checkUserIdentity() {
    console.log('--- Checking User Identities ---');

    const targetUserId = '4082c028-a842-4fa2-a27b-51d8130a9b3d';

    // Check who owns the 'test' group with pending requests
    const { data: user, error } = await supabase
        .from('users')
        .select('user_id, user_name, email')
        .eq('user_id', targetUserId)
        .single();

    if (user) {
        console.log(`The group "test" (with 3 pending requests) is OWNED by:`);
        console.log(` - Username: ${user.user_name}`);
        console.log(` - Email:    ${user.email}`);
        console.log(` - User ID:  ${user.user_id}`);
    } else {
        console.log('Could not find user with ID:', targetUserId);
    }
}

checkUserIdentity().catch(console.error);
