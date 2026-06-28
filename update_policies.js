const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { data, error } = await supabase.rpc('execute_sql', {
    sql: `
      CREATE POLICY "Allow public uploads" ON storage.objects FOR INSERT TO public WITH CHECK (bucket_id = 'images');
      CREATE POLICY "Allow public read" ON storage.objects FOR SELECT TO public USING (bucket_id = 'images');
    `
  });
  console.log(error || 'Policies updated');
}
run();
