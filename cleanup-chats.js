const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, 'apps/backend/.env') });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function cleanup() {
    console.log('Fetching all chats...');
    const { data: chats, error } = await supabase.from('chats').select('chat_id, group_id').order('created_date', { ascending: true });

    if (error) {
        console.error('Error fetching chats:', error);
        return;
    }

    const seen = new Set();
    const toDelete = [];

    for (const chat of chats) {
        if (seen.has(chat.group_id)) {
            toDelete.push(chat.chat_id);
        } else {
            seen.add(chat.group_id);
        }
    }

    console.log(`Found ${toDelete.length} duplicate chats to delete.`);

    if (toDelete.length > 0) {
        // We might need to delete messages first if there's a constraint, 
        // but let's try direct deletion first.
        const { error: delError } = await supabase
            .from('chats')
            .delete()
            .in('chat_id', toDelete);

        if (delError) {
            console.error('Error deleting duplicates:', delError);
        } else {
            console.log('Successfully cleaned up duplicates.');
        }
    }
}

cleanup();
