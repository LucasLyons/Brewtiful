import { createClient } from '@/utils/supabase/server';
import { notFound } from 'next/navigation';
import { BeerInfoCard } from '@/components/beer-info-card';
import { SimilarBeers } from '@/components/similar-beers';
import { getSimilarBeers } from '@/lib/recommendations/beer-similar';

interface BeerDetailPageProps {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    showInactive?: string;
  }>;
}

export default async function BeerDetailPage({ params, searchParams }: BeerDetailPageProps) {
  const supabase = await createClient();
  const { id } = await params;
  const { showInactive } = await searchParams;

  // Convert id to number since beer_id is stored as integer
  const beerIdNum = parseInt(id, 10);

  // Parse showInactive query param
  const shouldShowInactive = showInactive === 'true';

  // Fetch beer details with brewery information
  const { data: beer, error: beerError } = await supabase
    .from('beers')
    .select(`
      *,
      brewery:breweries (
        brewery_id,
        name,
        country,
        province_or_state,
        city
      )
    `)
    .eq('beer_id', beerIdNum)
    .single();

  if (beerError || !beer) {
    notFound();
  }

  // Fetch similar beers based on embeddings
  const similarBeers = await getSimilarBeers(beerIdNum, 10, shouldShowInactive);

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Beer Info Card */}
      <BeerInfoCard beer={beer} />

      {/* Similar Beers Carousel */}
      {similarBeers.length > 0 && (
        <SimilarBeers
          beers={similarBeers}
          showInactive={shouldShowInactive}
        />
      )}
    </div>
  );
}
