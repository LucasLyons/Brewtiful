// Quick test script to check if RPC function is accessible
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://pquapqyxlbkkbrelhvzz.supabase.co';
const supabaseKey = 'sb_publishable___l-CE52B9z8bcOJNpjxnA_2dp_8Qym';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testRPC() {
  console.log('Testing RPC function...');

  // First, let's get a valid beer ID
  const { data: beers, error: beersError } = await supabase
    .from('beers')
    .select('beer_id')
    .limit(1);

  if (beersError) {
    console.error('Error fetching beers:', beersError);
    return;
  }

  if (!beers || beers.length === 0) {
    console.error('No beers found in database');
    return;
  }

  const testBeerId = beers[0].beer_id;
  console.log('Testing with beer_id:', testBeerId);

  // Now test the RPC function
  const { data, error } = await supabase.rpc('get_similar_beers', {
    beer_id_input: testBeerId,
    match_count: 5
  });

  console.log('\n=== RPC Result ===');
  console.log('Error:', error);
  console.log('Data:', data);
  console.log('Data type:', typeof data);
  console.log('Is array?:', Array.isArray(data));
  console.log('Length:', data?.length);

  if (data && data.length > 0) {
    console.log('\nFirst result:', data[0]);
    console.log('Column names:', Object.keys(data[0]));
  }
}

testRPC().then(() => process.exit(0));
