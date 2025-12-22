
import { supabase } from './lib/supabase';

async function checkSchema() {
    console.log('Checking database schema...');

    const tables = ['calendar_events', 'chats', 'groups', 'group_members', 'messages', 'tasks', 'users'];

    for (const table of tables) {
        console.log(`\n--- Table: ${table} ---`);
        // We fetch one row to infer columns (Supabase JS doesn't have a direct 'describe table' method easily accessible in client)
        const { data, error } = await supabase.from(table).select('*').limit(1);

        if (error) {
            console.error(`Error fetching ${table}:`, error.message);
            continue;
        }

        if (data && data.length > 0) {
            console.log('Columns:', Object.keys(data[0]).join(', '));
        } else {
            console.log('Table exists but is empty. Cannot infer columns easily via select.');
            // Attempt an insert failure to see schema? No, too risky.
        }
    }
}

checkSchema();
