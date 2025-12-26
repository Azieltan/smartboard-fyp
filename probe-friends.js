const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, 'apps/backend/.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, serviceKey);

async function probe() {
    console.log('Probing friends table columns...');

    // We try to fetch all columns by selecting a non-existent column 
    // and seeing if the error message lists available columns (PostgREST does this sometimes).
    const { error } = await supabase.from('friends').select('non_existent_column_123').limit(1);
    if (error) {
        console.log('Error message:', error.message);
    }

    // Try to see if it has 'id'
    const { data: idCheck } = await supabase.from('friends').select('id').limit(1);
    console.log('ID column exists:', !!idCheck);

    // Try common names one by one
    const names = ['user_id', 'friend_id', 'requester_id', 'addressee_id', 'sender_id', 'receiver_id', 'uid1', 'uid2'];
    for (const name of names) {
        const { error } = await supabase.from('friends').select(name).limit(1);
        if (!error) console.log('Column FOUND:', name);
    }
}

probe();
