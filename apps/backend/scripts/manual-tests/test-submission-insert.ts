
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || 'https://hwqykcvqbrqcsdmqrfci.supabase.co';
const serviceKey = process.env.SUPABASE_SERVICE_KEY || 'sb_secret_7hABIeqnFqzDFNdHHZ55uw_0RyKQAHU';

const supabase = createClient(supabaseUrl, serviceKey);

async function testSubmissionInsert() {
    console.log('Testing insertion into task_submissions with attachments...');

    // 1. Get a task ID (any existing)
    const { data: task } = await supabase.from('tasks').select('task_id').limit(1).single();
    if (!task) {
        console.log('No task found to test submission.');
        return;
    }
    const taskId = task.task_id;
    console.log('Using Task ID:', taskId);

    // 2. Try simple insert without attachments
    console.log('--- Attempt 1: No attachments ---');
    const { data: sub1, error: err1 } = await supabase.from('task_submissions').insert([{
        task_id: taskId,
        user_id: 'test-user', // Assuming FK to 'users' exists? Wait, user_id needs to exist.
        // Let's get a user too.
        content: 'Test content no files',
        attachments: []
    }]).select().single();

    // We might fail on FK user_id if 'test-user' doesn't exist.
    // Let's get a user.
    const { data: user } = await supabase.from('users').select('user_id').limit(1).single();
    const userId = user ? user.user_id : 'test-user';
    console.log('Using User ID:', userId);

    if (err1 && err1.message.includes('foreign key')) {
        // retry with valid user
        const { data: sub1Retry, error: err1Retry } = await supabase.from('task_submissions').insert([{
            task_id: taskId,
            user_id: userId,
            content: 'Test content no files retry',
            attachments: []
        }]).select().single();
        if (err1Retry) console.log('❌ Attempt 1 Failed:', err1Retry.message);
        else console.log('✅ Attempt 1 Success');
    } else if (err1) {
        console.log('❌ Attempt 1 Failed:', err1.message);
    } else {
        console.log('✅ Attempt 1 Success');
    }

    // 3. Try insert WITH attachments
    console.log('--- Attempt 2: WITH attachments ---');
    const { data: sub2, error: err2 } = await supabase.from('task_submissions').insert([{
        task_id: taskId,
        user_id: userId,
        content: 'Test content WITH files',
        attachments: ['https://example.com/file1.png', 'https://example.com/file2.pdf']
    }]).select().single();

    if (err2) {
        console.log('❌ Attempt 2 Failed:', err2.message);
    } else {
        console.log('✅ Attempt 2 Success');
        console.log('Inserted:', sub2);
    }
}

testSubmissionInsert();
