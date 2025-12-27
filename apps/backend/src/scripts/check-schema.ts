
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load env vars from backend root
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import { supabase } from '../lib/supabase';

async function main() {
  console.log('Checking notifications table schema...');

  // Attempt to insert a dummy notification to see what keys return, or just select
  // We try to select * limit 1
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .limit(1);

  if (error) {
    console.error('Error selecting from notifications:', error);
    return;
  }

  if (data && data.length > 0) {
    console.log('Row keys:', Object.keys(data[0]));
  } else {
    console.log('No rows in notifications table. Cannot infer keys from select.');
    // Try inserting with 'is_read'
    console.log('Attempting insert with is_read...');
    const { error: errorIsRead } = await supabase
      .from('notifications')
      .insert([{
        user_id: '00000000-0000-0000-0000-000000000000', // Likely fail FK
        type: 'test',
        title: 'test',
        is_read: false
      }]);

    console.log('Insert is_read error:', errorIsRead?.message);

    // Try inserting with 'read'
    console.log('Attempting insert with read...');
    const { error: errorRead } = await supabase
      .from('notifications')
      .insert([{
        user_id: '00000000-0000-0000-0000-000000000000', // Likely fail FK
        type: 'test',
        title: 'test',
        read: false
      }]);

    console.log('Insert read error:', errorRead?.message);
  }
}

main();
