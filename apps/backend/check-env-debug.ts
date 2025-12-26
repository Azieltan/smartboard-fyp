import dotenv from 'dotenv';
dotenv.config();

const url = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_KEY;
const anonKey = process.env.SUPABASE_ANON_KEY;

console.log('SUPABASE_URL:', url ? 'Defined' : 'Missing');
console.log('SUPABASE_SERVICE_KEY:', serviceKey ? `Defined (Length: ${serviceKey.length})` : 'Missing');
console.log('SUPABASE_ANON_KEY:', anonKey ? `Defined (Length: ${anonKey.length})` : 'Missing');

if (serviceKey === anonKey) {
    console.warn('WARNING: SERVICE_KEY and ANON_KEY are the same!');
}
