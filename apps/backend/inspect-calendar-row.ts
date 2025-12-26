import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hwqykcvqbrqcsdmqrfci.supabase.co';
const serviceKey = 'sb_secret_7hABIeqnFqzDFNdHHZ55uw_0RyKQAHU';

const supabase = createClient(supabaseUrl, serviceKey);

async function inspectRow() {
    const { data, error } = await supabase.from('calendar_events').select('*').limit(1);
    if (error) {
        console.log('Error:', error.message);
    } else {
        console.log('Sample Row:', JSON.stringify(data[0], null, 2));
    }
}

inspectRow();
