const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, 'apps/backend/.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, serviceKey);

async function probe() {
    console.log('Probing friend_requests columns...');
    const columns = ['request_id', 'from_user_id', 'to_user_id', 'status', 'created_at'];

    for (const col of columns) {
        const { error } = await supabase.from('friend_requests').select(col).limit(1);
        if (!error) console.log(`[FOUND] ${col}`);
        else console.log(`[NOT FOUND] ${col}: ${error.message}`);
    }
}

probe();
