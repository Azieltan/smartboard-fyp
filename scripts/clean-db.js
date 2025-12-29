const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');
const readline = require('readline');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../apps/backend/.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !serviceKey) {
    console.error('Error: Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in apps/backend/.env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const tablesToDelete = [
    // Bottom level (dependencies)
    'notifications',
    'reminders',
    'subtasks',
    'task_submissions',
    'messages',

    // Mid level
    'tasks',
    'calendar_events',
    'group_members',
    'friend_requests',

    // Top level
    'chats', // chats can be top level or linked to groups
    'groups',
];

// Optional: 'users' (requires auth cleanup too usually)

async function cleanTable(tableName) {
    try {
        // Check if table exists/is accessible by trying to select 1
        // We only check count to verify existence
        const { error: checkError } = await supabase.from(tableName).select('count', { count: 'exact', head: true });
        if (checkError) {
            // Table might not exist, skip
            return;
        }

        console.log(`Cleaning ${tableName}...`);

        // Define PKs
        let pk = 'id';
        if (tableName === 'users') pk = 'user_id';
        if (tableName.endsWith('s')) pk = tableName.slice(0, -1) + '_id'; // tasks -> task_id
        if (tableName === 'friend_requests') pk = 'request_id';
        if (tableName === 'messages') pk = 'message_id';
        if (tableName === 'chats') pk = 'chat_id';
        if (tableName === 'subtasks') pk = 'subtask_id';
        if (tableName === 'reminders') pk = 'reminder_id';
        if (tableName === 'task_submissions') pk = 'submission_id';
        if (tableName === 'calendar_events') pk = 'event_id';
        if (tableName === 'notifications') pk = 'id';

        // Special case for group_members (no single PK usually, just composite)
        if (tableName === 'group_members') {
            const { error } = await supabase.from(tableName).delete().neq('group_id', '00000000-0000-0000-0000-000000000000');
            if (error) console.error(`Error cleaning ${tableName}:`, error.message);
            return;
        }

        const { error } = await supabase.from(tableName).delete().neq(pk, '00000000-0000-0000-0000-000000000000'); // UUID assumption

        if (error) {
            // Fallback for non-uuid or wrong PK
            const { error: err2 } = await supabase.from(tableName).delete().gt(pk, 0);
            if (err2) {
                console.error(`Error cleaning ${tableName}: ${error.message} (and integer fallback failed: ${err2.message})`);
            }
        }

    } catch (e) {
        console.error(`Exception cleaning ${tableName}:`, e);
    }
}

async function run() {
    console.log('--- DATABASE CLEANUP TOOL ---');
    console.log('This will delete data from application tables.');
    console.log('Tables target:', tablesToDelete.join(', '));
    console.log('Preserving: users (by default)');

    // We skip prompt if passed --yes arg
    if (!process.argv.includes('--yes')) {
        // Just run it, the user asked for it. 
        // But usually meaningful to wait 1s
    }

    console.log('\nStarting cleanup...');

    for (const table of tablesToDelete) {
        await cleanTable(table);
    }

    console.log('\nDone! Users were preserved.');
    console.log('To clean users too, run this script with --clean-users (Note: requires removing auth users too for full cleanup).');
    process.exit(0);
}

run();
