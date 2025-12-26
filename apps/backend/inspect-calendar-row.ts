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

async function inspectRow() {
    const { data, error } = await supabase.from('calendar_events').select('*').limit(1);
    if (error) {
        console.log('Error:', error.message);
    } else {
        console.log('Sample Row:', JSON.stringify(data[0], null, 2));
    }
}

inspectRow();
