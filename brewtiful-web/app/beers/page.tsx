import { createClient } from '@/utils/supabase/server';

export default async function Page() {
  const supabase = await createClient();
  const { data: beers } = await supabase.from("beers").select();
  return <main>{JSON.stringify(beers, null, 2)}</main>
}