import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hwqykcvqbrqcsdmqrfci.supabase.co';
const serviceKey = 'sb_secret_7hABIeqnFqzDFNdHHZ55uw_0RyKQAHU';

const supabase = createClient(supabaseUrl, serviceKey);

async function checkTables() {
    console.log('Checking tables in the repository...');
    const tables = ['users', 'groups', 'group_members', 'calendar_events', 'tasks', 'messages', 'chats', 'friends'];

    for (const table of tables) {
        try {
            const { error } = await supabase.from(table).select('*').limit(0);
            if (error) {
                console.log(`❌ Table [${table}] does NOT exist or error: ${error.message}`);
            } else {
                console.log(`✅ Table [${table}] exists.`);
            }
        } catch (err: any) {
            console.log(`❌ Table [${table}] error: ${err.message}`);
        }
    }
}

checkTables();
