import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hwqykcvqbrqcsdmqrfci.supabase.co';
const serviceKey = 'sb_secret_7hABIeqnFqzDFNdHHZ55uw_0RyKQAHU';

const supabase = createClient(supabaseUrl, serviceKey);

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
