import { supabase } from './lib/supabase';
import bcrypt from 'bcryptjs';

export async function seedDatabase() {
  console.log('Starting database seed...');

  // 1. Create Users
  const passwordHash = await bcrypt.hash('password123', 10);

  const users = [
    {
      user_id: 'ADMIN001',
      user_name: 'Admin User',
      email: 'admin@example.com',
      password_hash: passwordHash,
      role: 'admin'
    },
    {
      user_id: 'USER001',
      user_name: 'John Doe',
      email: 'john@example.com',
      password_hash: passwordHash,
      role: 'member'
    },
    {
      user_id: 'USER002',
      user_name: 'Jane Smith',
      email: 'jane@example.com',
      password_hash: passwordHash,
      role: 'member'
    }
  ];

  for (const user of users) {
    const { error } = await supabase
      .from('users')
      .upsert(user, { onConflict: 'email' });

    if (error) console.error(`Error creating user ${user.email}:`, error.message);
    else console.log(`User ${user.email} created/updated.`);
  }

  // 2. Create Group
  const groupId = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
  const group = {
    group_id: groupId,
    name: 'Engineering Team',
    user_id: 'USER001', // Owner
    created_at: new Date().toISOString()
  };

  const { error: groupError } = await supabase
    .from('groups')
    .upsert(group, { onConflict: 'group_id' });

  if (groupError) console.error('Error creating group:', groupError.message);
  else console.log('Group created.');

  // 3. Add Members to Group
  const members = [
    { group_id: groupId, user_id: 'USER001', role: 'owner' },
    { group_id: groupId, user_id: 'USER002', role: 'member' }
  ];

  for (const member of members) {
    const { error } = await supabase
      .from('group_members')
      .upsert(member, { onConflict: 'group_id,user_id' });

    if (error) console.error(`Error adding member ${member.user_id}:`, error.message);
  }

  // 4. Create Tasks
  const tasks = [
    {
      task_id: 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      title: 'Setup Project Structure',
      description: 'Initialize repo and install dependencies',
      status: 'done', // Schema: todo, in_progress, done
      priority: 'high',
      due_date: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
      created_by: 'USER001',
      user_id: 'USER001'
    },
    {
      task_id: 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      title: 'Implement Auth',
      description: 'Setup Supabase auth',
      status: 'in_progress',
      priority: 'high',
      due_date: new Date(Date.now() + 172800000).toISOString(), // Day after tomorrow
      created_by: 'USER001',
      user_id: 'USER001'
    },
    {
      task_id: 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      title: 'Design Dashboard',
      description: 'Create Figma mockups',
      status: 'todo',
      priority: 'medium',
      due_date: new Date(Date.now() + 259200000).toISOString(),
      created_by: 'USER001',
      user_id: 'USER002'
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
