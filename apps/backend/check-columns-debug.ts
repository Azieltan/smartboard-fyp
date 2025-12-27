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

async function checkColumns() {
    console.log('Checking columns for [groups] and [group_members]...');

    try {
        // Try to fetch one row to see columns
        const { data: gData, error: gError } = await supabase.from('groups').select('*').limit(1);
        if (gError) {
            console.log('Error fetching groups:', gError.message);
        } else {
            console.log('Groups columns:', Object.keys(gData[0] || {}));
        }

        const { data: mData, error: mError } = await supabase.from('group_members').select('*').limit(1);
        if (mError) {
            console.log('Error fetching group_members:', mError.message);
        } else {
            console.log('Group Members columns:', Object.keys(mData[0] || {}));
        }
    } catch (err: any) {
        console.log('Unexpected error:', err.message);
    }
}

checkColumns();
