
import { supabase } from './src/lib/supabase';
import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

async function testCalendarEndpoint() {
    // 1. Get a user
    const { data: user } = await supabase.from('users').select('user_id').limit(1).single();
    if (!user) {
        console.log('No users found to test with.');
        return;
    }
    const userId = user.user_id;
    console.log('Testing calendar with userId:', userId);

    // 2. Call endpoint
    try {
        const response = await axios.get(`http://localhost:3001/calendar/${userId}`);
        console.log('Response status:', response.status);
        console.log('Response data type:', typeof response.data);
        if (typeof response.data === 'string' && response.data.trim().startsWith('<')) {
             console.error('Response is HTML!');
        } else {
             console.log('Response is JSON (good).');
        }
    } catch (error: any) {
        console.error('Error calling endpoint:', error.message);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
        }
    }
}

testCalendarEndpoint();
