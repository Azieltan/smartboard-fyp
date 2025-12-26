import { supabase } from './src/lib/supabase';

async function testConnection() {
    console.log('Testing Supabase connection...');
    try {
        const { count, error } = await supabase.from('users').select('*', { count: 'exact', head: true });
        if (error) {
            console.error('Database connection error:', error.message);
        } else {
            console.log('Successfully connected to Database!');
            console.log('Total rows in users table:', count);
        }

        console.log('\nTesting Supabase Auth Admin access...');
        const { data: userList, error: authError } = await supabase.auth.admin.listUsers();
        if (authError) {
            console.error('Auth Admin error (Likely missing service_role key):', authError.message);
        } else {
            console.log('Successfully accessed Auth Admin!');
            console.log('Number of auth users:', userList.users.length);
        }
        process.exit(0);
    } catch (err: any) {
        console.error('Unexpected error:', err.message);
        process.exit(1);
    }
}

testConnection();
