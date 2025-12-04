import { supabase } from './lib/supabase';
import dotenv from 'dotenv';

dotenv.config();

async function verifyConnection() {
    console.log('Testing connection to Supabase...');

    try {
        const { data, error } = await supabase.from('users').select('count', { count: 'exact', head: true });

        if (error) {
            console.error('❌ Connection Failed:', error.message);
            console.error('Details:', error);
        } else {
            console.log('✅ Connection Successful!');
            console.log(`Current user count: ${data}`);
            console.log('The application is correctly linked to your Supabase database.');
        }
    } catch (err: any) {
        console.error('❌ Unexpected Error:', err.message);
    }
}

verifyConnection();
