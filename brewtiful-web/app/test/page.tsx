import { getSimilarBeerIds } from '@/lib/recommendations/beer-similar';
import { createClient } from '@/utils/supabase/server';

export default async function TestPage() {
  const supabase = await createClient();
  const beerId = 5;
  const similarBeers = await getSimilarBeerIds(beerId);

  return (
    <div className="container mx-auto p-8">
      {similarBeers.length}
    </div>
  );
}