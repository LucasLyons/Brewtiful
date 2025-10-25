// Check if embeddings exist
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://pquapqyxlbkkbrelhvzz.supabase.co';
const supabaseKey = 'sb_publishable___l-CE52B9z8bcOJNpjxnA_2dp_8Qym';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkEmbeddings() {
  console.log('Checking beer_embeddings table...\n');

  // Count total embeddings
  const { count, error: countError } = await supabase
    .from('beer_embeddings')
    .select('*', { count: 'exact', head: true });

  if (countError) {
    console.error('Error counting embeddings:', countError);
    return;
  }

  console.log('Total embeddings in table:', count);

  // Get a few sample embeddings
  const { data: samples, error: samplesError } = await supabase
    .from('beer_embeddings')
    .select('id')
    .limit(5);

  if (samplesError) {
    console.error('Error fetching samples:', samplesError);
    return;
  }

  console.log('Sample beer IDs with embeddings:', samples?.map(s => s.id));

  // Check if beer 544085 has an embedding
  const { data: testBeer, error: testError } = await supabase
    .from('beer_embeddings')
    .select('id')
    .eq('id', 544085)
    .maybeSingle();

  console.log('\nDoes beer 544085 have an embedding?', testBeer ? 'YES' : 'NO');

  // If it doesn't exist, get a beer that does have an embedding
  if (!testBeer && samples && samples.length > 0) {
    const validBeerId = samples[0].id;
    console.log('\nTrying with a beer that HAS an embedding:', validBeerId);

    const { data, error } = await supabase.rpc('get_similar_beers', {
      beer_id_input: validBeerId,
      match_count: 5
    });

    console.log('\nRPC Result with valid beer:');
    console.log('Error:', error);
    console.log('Data:', data);
    console.log('Length:', data?.length);

    if (data && data.length > 0) {
      console.log('First result:', data[0]);
    }
  }
}

checkEmbeddings().then(() => process.exit(0));
