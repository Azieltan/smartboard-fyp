const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, 'apps/backend/.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, serviceKey);

async function testJoin() {
    console.log('Testing join on friend_requests...');
    const { data, error } = await supabase
        .from('friend_requests')
        .select(`
            *,
            from_user:users!from_user_id(user_name, email),
            to_user:users!to_user_id(user_name, email)
        `)
        .limit(1);

    if (error) {
        console.log('Join Error:', error.message);
        // Try without explicit FK if it's named differently
        const { error: error2 } = await supabase
            .from('friend_requests')
            .select(`
                *,
                from_user:users(user_name),
                to_user:users(user_name)
            `)
            .limit(1);
        if (error2) console.log('Generic Join Error:', error2.message);
    } else {
        console.log('Join Success!');
    }
}

testJoin();
