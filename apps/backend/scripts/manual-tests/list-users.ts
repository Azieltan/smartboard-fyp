import { supabase } from '../../src/lib/supabase';

async function listUsers() {
    const { data, error } = await supabase.from('users').select('user_id, user_name, email').limit(5);
    if (error) {
        console.error('Error fetching users:', error.message);
        return;
    }
    console.log('Sample Users:');
    console.table(data);
}

listUsers();
