const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, 'apps/backend/.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, serviceKey);

async function probe() {
    console.log('Deep Probing of friends table...');
    const table = 'friends';
    const columns = ['user_id', 'friend_id', 'requester_id', 'addressee_id', 'id', 'status'];

    for (const col of columns) {
        const { error } = await supabase.from(table).select(col).limit(1);
        if (error) {
            console.log(`[X] ${col}: ${error.message}`);
        } else {
            console.log(`[!] FOUND: ${col}`);
        }
    }
}

probe();
