
import { AuthService } from './src/services/auth';
import { supabase } from './src/lib/supabase';

async function createAdmin() {
    const email = 'admin@test.com';
    const password = 'password123';
    const username = 'System Admin';

    console.log(`Creating admin user: ${email}`);

    try {
        // 1. Try to register
        try {
            await AuthService.register(username, email, password);
            console.log('User registered.');
        } catch (e: any) {
            if (e.message.includes('already registered') || e.message.includes('duplicate')) {
                console.log('User already exists, updating role...');
            } else {
                throw e;
            }
        }

        // 2. Update role to admin
        const { data: user, error: findError } = await supabase
            .from('users')
            .select('user_id')
            .eq('email', email)
            .single();

        if (findError || !user) {
            throw new Error('User not found after registration');
        }

        const { error: updateError } = await supabase
            .from('users')
            .update({ role: 'admin' })
            .eq('user_id', user.user_id);

        if (updateError) {
            throw new Error(`Failed to update role: ${updateError.message}`);
        }

        console.log(`Successfully promoted ${email} to admin.`);

    } catch (error: any) {
        console.error('Failed to create admin:', error.message);
    }
}

createAdmin();
