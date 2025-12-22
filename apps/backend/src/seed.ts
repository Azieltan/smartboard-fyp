import { supabase } from './lib/supabase';

export async function seedDatabase() {
  console.log('Starting database seed...');
  let hadErrors = false;

  // Option B uses Supabase Auth UUID users.
  // This seed assumes you already have at least 1 row in public.users.
  const { data: firstUser, error: userErr } = await supabase
    .from('users')
    .select('user_id, email')
    .limit(1)
    .maybeSingle();

  if (userErr || !firstUser) {
    console.warn('No users found in public.users. Register a user first, then re-run /seed.');
    return { success: false, message: 'No users found to seed with.' };
  }

  // 2. Create Group
  const group = {
    name: 'Engineering Team',
    owner_id: firstUser.user_id,
    join_code: 'ENG123',
    requires_approval: false,
    is_dm: false
  };

  const { data: createdGroup, error: groupError } = await supabase
    .from('groups')
    .insert([group])
    .select('*')
    .single();

  if (groupError) {
    hadErrors = true;
    console.error('Error creating group:', groupError.message);
  }
  else console.log('Group created.');

  // 3. Add Members to Group

  if (createdGroup) {
    const { error: memberErr } = await supabase
      .from('group_members')
      .upsert(
        {
          group_id: createdGroup.group_id,
          user_id: firstUser.user_id,
          role: 'admin',
          status: 'active'
        },
        { onConflict: 'group_id,user_id' }
      );
    if (memberErr) {
      hadErrors = true;
      console.error('Error adding owner to group:', memberErr.message);
    }
  } else {
    hadErrors = true;
  }

  // 4. Create Tasks
  const tasks = [
    {
      title: 'Setup Project Structure',
      description: 'Initialize repo and install dependencies',
      status: 'done', // Schema: todo, in_progress, done
      priority: 'high',
      due_date: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
      owner_id: firstUser.user_id,
      group_id: createdGroup?.group_id
    },
    {
      title: 'Implement Auth',
      description: 'Setup Supabase auth',
      status: 'in_progress',
      priority: 'high',
      due_date: new Date(Date.now() + 172800000).toISOString(), // Day after tomorrow
      owner_id: firstUser.user_id,
      group_id: createdGroup?.group_id
    },
    {
      title: 'Design Dashboard',
      description: 'Create Figma mockups',
      status: 'todo',
      priority: 'medium',
      due_date: new Date(Date.now() + 259200000).toISOString(),
      owner_id: firstUser.user_id,
      group_id: createdGroup?.group_id
    }
  ];

  for (const task of tasks) {
    const { error } = await supabase
      .from('tasks')
      .upsert(task, { onConflict: 'task_id' });

    if (error) {
      hadErrors = true;
      console.error(`Error creating task ${task.title}:`, error.message);
    }
  }

  console.log('Database seed completed.');
  return hadErrors
    ? { success: false, message: 'Database seed completed with errors' }
    : { success: true, message: 'Database seeded successfully' };
}

// Allow running via: npx ts-node src/seed.ts
if (require.main === module) {
  seedDatabase()
    .then((result) => {
      if (!result?.success) process.exitCode = 1;
    })
    .catch((err) => {
      console.error('Seed failed:', err?.message || err);
      process.exitCode = 1;
    });
}
