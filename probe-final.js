const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, 'apps/backend/.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, serviceKey);

async function probe() {
    console.log('Final probing of friends and friend_requests...');
    const tables = ['friends', 'friend_requests'];
    const columns = ['from_user_id', 'to_user_id', 'request_id', 'user_id', 'friend_id'];

    for (const table of tables) {
        console.log(`\nTable: ${table}`);
        for (const col of columns) {
            const { error } = await supabase.from(table).select(col).limit(1);
            if (!error) console.log(`[FOUND] ${table}.${col}`);
        }
    }
}

probe();
