const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://sfcpviebwptrikrimaen.supabase.co', process.env.SUPABASE_ANON_KEY || 'dummy');
// we just need the sql query actually, let's use psql to check the exact schema columns
