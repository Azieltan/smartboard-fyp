const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, 'apps/backend/.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, serviceKey);

async function check() {
    const { data, error } = await supabase.from('friends').select('*').limit(1).csv();
    if (error) {
        console.log('Error:', error.message);
    } else {
        console.log('CSV Result (Headers):');
        console.log(data);
    }
}

check();
