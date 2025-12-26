import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !serviceKey) {
    console.error('Error: SUPABASE_URL and SUPABASE_SERVICE_KEY must be set in .env file');
    process.exit(1);
}

// Type assertion: we've validated these are defined above
const supabase = createClient(supabaseUrl as string, serviceKey as string);

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
