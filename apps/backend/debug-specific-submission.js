
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL || 'https://hwqykcvqbrqcsdmqrfci.supabase.co';
const serviceKey = process.env.SUPABASE_SERVICE_KEY || 'sb_secret_7hABIeqnFqzDFNdHHZ55uw_0RyKQAHU';

const supabase = createClient(supabaseUrl, serviceKey);

async function inspectSubmissions() {
    console.log('--- Inspecting Submissions ---');

    const taskId = '5c851f45-75ef-4a64-b33b-906832e6f707'; // The 'test1' task from previous debug
    console.log(`Checking submissions for Task ID: ${taskId}`);

    const { data: submissions, error } = await supabase
        .from('task_submissions')
        .select('*')
        .eq('task_id', taskId);

    if (error) {
        console.log('Error fetching submissions:', error.message);
        return;
    }

    if (submissions && submissions.length > 0) {
        submissions.forEach(sub => {
            console.log('Submission found:');
            console.log(`  ID: ${sub.submission_id}`);
            console.log(`  Status: ${sub.status}`);
            console.log(`  Content: ${sub.content}`);
            console.log(`  Attachments: ${JSON.stringify(sub.attachments)}`);
        });
    } else {
        console.log('❌ No submissions found for this task.');
        console.log('This explains why the Review Modal shows "No submission found" or generic details instead of Review Actions.');
    }
}

inspectSubmissions();
