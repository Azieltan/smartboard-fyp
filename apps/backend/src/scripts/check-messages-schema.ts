
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load env vars from backend root
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import { supabase } from '../lib/supabase';

async function main() {
  console.log('Checking messages table schema...');

  // Select 1 row
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .limit(1);

  if (error) {
    console.error('Error selecting from messages:', error);
  } else if (data && data.length > 0) {
    console.log('Row keys:', Object.keys(data[0]));
  } else {
    console.log('No rows in messages table. Attempting to insert dummy to find missing columns...');
    // Try insert with minimal columns to see what errors
    const { error: insertError } = await supabase
      .from('messages')
      .insert([{
        chat_id: '00000000-0000-0000-0000-000000000000', // Likely FK error, but will check column constraints first
        user_id: '00000000-0000-0000-0000-000000000000',
        content: 'test'
      }]);

    console.log('Insert error:', insertError?.message);
    console.log('Full Error Details:', insertError);
  }
}

main();
