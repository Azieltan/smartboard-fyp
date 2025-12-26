const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, 'apps/backend/.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, serviceKey);

async function probe() {
    console.log('Probing friend_requests table columns...');
    const tables = ['friend_requests', 'friends'];
    const names = ['user_id', 'friend_id', 'requester_id', 'addressee_id', 'sender_id', 'receiver_id', 'id'];

    for (const table of tables) {
        console.log(`\nTable: ${table}`);
        for (const name of names) {
            const { error } = await supabase.from(table).select(name).limit(1);
            if (!error) console.log(`[FOUND] ${table}.${name}`);
        }
    }
}

probe();
