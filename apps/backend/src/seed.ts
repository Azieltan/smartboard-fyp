import { supabase } from './lib/supabase';

export async function seedDatabase() {
  console.log('Starting database seed...');

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

  if (groupError) console.error('Error creating group:', groupError.message);
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
    if (memberErr) console.error('Error adding owner to group:', memberErr.message);
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

    if (error) console.error(`Error creating task ${task.title}:`, error.message);
  }

  console.log('Database seed completed.');
  return { success: true, message: 'Database seeded successfully' };
}
