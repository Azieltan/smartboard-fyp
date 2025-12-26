
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || 'https://hwqykcvqbrqcsdmqrfci.supabase.co';
const serviceKey = process.env.SUPABASE_SERVICE_KEY || 'sb_secret_7hABIeqnFqzDFNdHHZ55uw_0RyKQAHU';

const supabase = createClient(supabaseUrl, serviceKey);

async function checkTaskStatusConstraint() {
    console.log('Checking tasks status check constraint...');

    // We can't easily query check constraints directly via JS client nicely without SQL.
    // But we can try to insert/update a task with status 'in_review' and see if it fails.

    // 1. Create a dummy task
    const { data: task, error: createError } = await supabase
        .from('tasks')
        .insert([{
            title: 'Constraint Test Task',
            status: 'todo',
            priority: 'medium',
            created_by: 'test-user', // Assuming this user might not exist but if FK constraint exists it might fail. Only validation.
            // Actually, we need a valid user if FK exists.
            // Let's try to fetch a valid user first.
        }])
        .select()
        .single();

    // If creation fails due to missing user FK, we might skip creator.
    // If it fails, print error.
    if (createError) {
        console.log('Failed to create test task:', createError.message);
        // Try to verify if it was status related? No, initially 'todo' should work.

        // Let's try to read ONE existing task.
        const { data: existingTask } = await supabase.from('tasks').select('*').limit(1).single();
        if (existingTask) {
            console.log('Found existing task:', existingTask.task_id);
            // Try to update it to 'in_review'
            const { error: updateError } = await supabase
                .from('tasks')
                .update({ status: 'in_review' })
                .eq('task_id', existingTask.task_id);

            if (updateError) {
                console.error('❌ Update to in_review FAILED:', updateError.message);
                if (updateError.message.includes('check constraint')) {
                    console.log('👉 CONCLUSION: The "in_review" status is missing from the check constraint.');
                }
            } else {
                console.log('✅ Update to in_review SUCCEEDED. Constraint is correct.');
                // Revert
                await supabase.from('tasks').update({ status: existingTask.status }).eq('task_id', existingTask.task_id);
            }
        } else {
            console.log('No tasks found to test.');
        }
        return;
    }
}

checkTaskStatusConstraint();
