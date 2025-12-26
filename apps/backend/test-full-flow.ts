import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !serviceKey) {
    console.error('Error: SUPABASE_URL and SUPABASE_SERVICE_KEY must be set in .env file');
    process.exit(1);
}

// Type assertion: we've validated these are defined above
const supabase = createClient(supabaseUrl as string, serviceKey as string);

async function testFullFlow() {
    console.log('--- TESTING NEW CREDENTIALS & FLOW ---');
    const email = `test.user.${Date.now()}@example.com`;
    const password = 'Password123!';

    try {
        console.log(`1. Attempting to create auth user: ${email}`);
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
            email,
            password,
            email_confirm: true
        });

        if (authError) throw authError;
        console.log('✅ Auth user created successfully:', authData.user.id);

        console.log('2. Waiting a moment for trigger to run...');
        await new Promise(resolve => setTimeout(resolve, 2000));

        console.log('3. Checking if user exists in public.users table...');
        const { data: userData, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('user_id', authData.user.id)
            .single();

        if (userError) {
            console.log('❌ User not found in public.users. Trigger might be missing.');
            console.log('Error info:', userError.message);
        } else {
            console.log('✅ User found in public.users:', userData.user_name);
        }

        console.log('4. Attempting to sign in with this new user...');
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (signInError) {
            console.log('❌ Sign in failed:', signInError.message);
        } else {
            console.log('✅ Sign in successful! Token received.');
        }

    } catch (error: any) {
        console.error('Final Flow Fail:', error.message);
    }
}

testFullFlow();
