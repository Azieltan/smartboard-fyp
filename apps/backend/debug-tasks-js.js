
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL || 'https://hwqykcvqbrqcsdmqrfci.supabase.co';
const serviceKey = process.env.SUPABASE_SERVICE_KEY || 'sb_secret_7hABIeqnFqzDFNdHHZ55uw_0RyKQAHU';

const supabase = createClient(supabaseUrl, serviceKey);

async function inspectTasks() {
    console.log('--- Inspecting Tasks ---');

    // Get all users for reference
    const { data: users } = await supabase.from('users').select('user_id, email, user_name');
    const userMap = {};
    if (users) {
        users.forEach(u => userMap[u.user_id] = `${u.user_name} (${u.email})`);
    }

    // Get tasks
    const { data: tasks } = await supabase.from('tasks').select('*');

    if (tasks) {
        tasks.forEach(task => {
            console.log(`Task: [${task.title}]`);
            console.log(`  ID: ${task.task_id}`);
            console.log(`  Status: ${task.status}`);
            console.log(`  Assignee (user_id): ${task.user_id} -> ${userMap[task.user_id] || 'UNKNOWN'}`);
            console.log(`  Created By: ${task.created_by} -> ${userMap[task.created_by] || 'UNKNOWN'}`);
            console.log('-------------------------------------------');
        });
    } else {
        console.log('No tasks found.');
    }
}

inspectTasks();
