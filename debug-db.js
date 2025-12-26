const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, 'apps/backend/.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !serviceKey) {
    console.log('Missing credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);

async function listAllColumns() {
    // We try to query a system view if possible. 
    // Usually only allowed if we have service role key.
    // However, Supabase PostgREST might not expose information_schema directly.
    // Instead, we can try to "peek" into tables.

    const tables = ['users', 'groups', 'group_members', 'friends', 'tasks', 'calendar_events', 'chats', 'messages'];

    for (const table of tables) {
        console.log(`\n--- TABLE: ${table} ---`);
        try {
            // This trick sometimes works to see columns without data:
            const { data, error } = await supabase.from(table).select('*').limit(0);
            if (error) {
                console.log(`Error on ${table}:`, error.message);
            } else {
                // If PostgREST schema cache is working, sometimes data is returned as [] 
                // but we might not see column names if it's empty.
                // However, we can try to select a known column and see if it fails.
                console.log(`Table ${table} exists.`);
            }
        } catch (e) {
            console.log(`Catch on ${table}:`, e.message);
        }
    }
}

// Since friends is the issue, let's try some common column names.
async function probeFriendsTable() {
    console.log('\n--- PROBING FRIENDS TABLE ---');
    const columnGuesses = ['user_id', 'friend_id', 'requester_id', 'addressee_id', 'sender_id', 'receiver_id', 'user1_id', 'user2_id'];

    for (const col of columnGuesses) {
        const { error } = await supabase.from('friends').select(col).limit(1);
        if (!error) {
            console.log(`[FOUND!] Column exists: ${col}`);
        } else {
            // console.log(`[MISSING] Column ${col}: ${error.message}`);
        }
    }
}

probeFriendsTable().then(() => listAllColumns());
