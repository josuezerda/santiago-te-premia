const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
async function run() {
  const { data, error } = await supabase.storage.createBucket('images', {
    public: true,
    fileSizeLimit: 2097152, // 2MB
  });
  console.log(data, error);
}
run();
