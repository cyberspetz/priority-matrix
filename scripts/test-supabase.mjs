import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.error('Missing env: NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(2);
}

const supabase = createClient(url, key);

try {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .limit(1);

  if (error) {
    console.error('Supabase error:', error);
    process.exit(1);
  }

  console.log('OK: connected. Sample count =', Array.isArray(data) ? data.length : 'n/a');
} catch (e) {
  console.error('Network/Runtime error:', e?.message || e);
  process.exit(1);
}

