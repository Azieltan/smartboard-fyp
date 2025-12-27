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

async function checkCalendarColumns() {
    console.log('Checking columns for [calendar_events]...');
    try {
        const { data, error } = await supabase.from('calendar_events').select('*').limit(1);
        if (error) {
            console.log('Error:', error.message);
        } else {
            console.log('Calendar Events columns:', Object.keys(data[0] || {}));
        }
    } catch (err: any) {
        console.log('Unexpected error:', err.message);
    }
}

checkCalendarColumns();
