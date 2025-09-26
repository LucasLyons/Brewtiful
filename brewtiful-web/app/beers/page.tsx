import { createClient } from '@/utils/supabase/server';

export default async function Beers() {
  const supabase = await createClient();
  const { data: beers } = await supabase.from("beers").select();

  return <pre>{JSON.stringify(beers, null, 2)}</pre>
}