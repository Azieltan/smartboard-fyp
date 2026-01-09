
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !serviceKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);

async function addStatusColumn() {
    console.log('Adding is_active column to users table...');

    // We cannot run raw SQL directly with supabase-js unless using an RPC that executes SQL,
    // or if we had a direct connection.
    // HOWEVER, we can't easily add a column via standard JS client insert/update if it doesn't exist.
    // We CAN use the 'rpc' method if we had a function 'exec_sql'. We probably don't.
    // BUT the user instructions say we are in `c:\Users\aziel\fyp-project`.
    // Wait, I can't effectively modify the schema without SQL access.
    // I will check if I can use a workaround or if I should assume the feature is "logic-based" for now in 'role' or something?
    // User asked to "activate and also deactivate".
    // Let's try to add it via a raw query if the project has a way.
    // The 'database_schema.sql' is just a file.

    // WAIT, I see `test-db.ts` uses `supabase`.

    // Alternative: Store status in `role`? No, role is 'admin'|'member'.
    // Alternative: Use `user_metadata` in Supabase Auth? Yes, that's controllable.
    // BUT we need it in the public `users` table for easy query by admin.

    // Since I can't run DDL, I will try to use a "status" column if it exists or create a workaround using `role` temporarily?
    // No, that's bad.
    // Actually, I can try to use the `users` table directly. 
    // Let's Check if I can add a column via a Postgres function `exec_sql` if it exists (common pattern).

    const { error } = await supabase.rpc('exec_sql', {
        sql: 'ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;'
    });

    if (error) {
        console.error('Failed to add column via RPC:', error.message);
        // Fallback: If RPC fails, we might be stuck without being able to modify Schema.
        // In that case, I might repurpose a field or assume it works for the sake of the simulation if I can't change it.
        // Let's try and see. If it fails, I'll update the plan to use a side-table or something?
        // OR, I can create a new table "user_status" using standard create calls? No, can't create tables via JS client.

        console.log('Attempting to use "role" field for status? No.');
        console.log('Please run the following SQL manually if this fails: ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;');
    } else {
        console.log('Column added successfully.');
    }
}

addStatusColumn();
