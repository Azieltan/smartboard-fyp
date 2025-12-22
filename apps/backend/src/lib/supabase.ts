import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_KEY;
const anonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !serviceKey) {
    console.warn('Missing Supabase credentials in apps/backend/.env (SUPABASE_URL, SUPABASE_SERVICE_KEY)');
}

// Admin client: bypasses RLS. Use ONLY on backend.
export const supabase = createClient(supabaseUrl || '', serviceKey || '');

// User auth client: used for sign-in flows where Supabase expects anon/public key.
// If SUPABASE_ANON_KEY is not provided, fall back to service key to avoid hard crash,
// but you should set SUPABASE_ANON_KEY for correct/auth-safe behavior.
export const supabaseAuth = createClient(supabaseUrl || '', anonKey || serviceKey || '');
