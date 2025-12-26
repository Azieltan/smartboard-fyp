import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hwqykcvqbrqcsdmqrfci.supabase.co';
const serviceKey = 'sb_secret_7hABIeqnFqzDFNdHHZ55uw_0RyKQAHU';

const supabase = createClient(supabaseUrl, serviceKey);

async function checkTasksColumns() {
    console.log('Checking columns for [tasks]...');
    try {
        const { data, error } = await supabase.from('tasks').select('*').limit(1);
        if (error) {
            console.log('Error:', error.message);
        } else {
            console.log('Tasks columns:', Object.keys(data[0] || {}));
        }
    } catch (err: any) {
        console.log('Unexpected error:', err.message);
    }
}

checkTasksColumns();
