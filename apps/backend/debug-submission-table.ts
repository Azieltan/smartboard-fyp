
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || 'https://hwqykcvqbrqcsdmqrfci.supabase.co';
const serviceKey = process.env.SUPABASE_SERVICE_KEY || 'sb_secret_7hABIeqnFqzDFNdHHZ55uw_0RyKQAHU';

const supabase = createClient(supabaseUrl, serviceKey);

async function checkSubmissionTable() {
    console.log('Checking task_submissions table...');

    // Check if table exists by selecting empty
    const { error } = await supabase.from('task_submissions').select('*').limit(0);

    if (error) {
        console.error('❌ task_submissions table check failed:', error.message);
        if (error.message.includes('relation') && error.message.includes('does not exist')) {
            console.log('👉 CONCLUSION: "task_submissions" table is MISSING.');
        }
    } else {
        console.log('✅ task_submissions table exists.');
    }
}

checkSubmissionTable();
