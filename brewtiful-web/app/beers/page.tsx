import { createClient } from '@/utils/supabase/server';

export default async function Beers() {
  const supabase = await createClient();
  const { data: beers } = await supabase.from("beers").select();
  console.log('URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
  console.log('Key:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

  return <pre>{JSON.stringify(beers, null, 2)}</pre>
}