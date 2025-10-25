// Test with a beer ID that definitely has an embedding
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://pquapqyxlbkkbrelhvzz.supabase.co';
const supabaseKey = 'sb_publishable___l-CE52B9z8bcOJNpjxnA_2dp_8Qym';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testWithValidId() {
  // Test with beer_id 5 which we can see in the screenshot
  const testBeerId = 5;
  console.log('Testing with beer_id:', testBeerId);

  const { data, error } = await supabase.rpc('get_similar_beers', {
    beer_id_input: testBeerId,
    match_count: 10
  });

  console.log('\n=== RPC Result ===');
  console.log('Error:', error);
  console.log('Data:', data);
  console.log('Is array?:', Array.isArray(data));
  console.log('Length:', data?.length);

  if (data && data.length > 0) {
    console.log('\nFirst few results:');
    data.slice(0, 3).forEach(row => {
      console.log(row);
    });
  }

  // Also check if the embedding exists for this beer
  const { data: embedding, error: embError } = await supabase
    .from('beer_embeddings')
    .select('id')
    .eq('id', testBeerId)
    .single();

  console.log('\nDoes beer', testBeerId, 'have an embedding?', embedding ? 'YES' : 'NO');
  if (embError) console.log('Embedding check error:', embError);
}

testWithValidId().then(() => process.exit(0));
