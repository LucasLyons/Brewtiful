import { createClient } from '@/utils/supabase/server';
import { notFound } from 'next/navigation';
import { BeerInfoCard } from '@/components/beer/beer-info-card';
import { SimilarBeers } from '@/components/beer/similar-beers';
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
      beer_id,
      name,
      style,
      super_style,
      abv,
      description,
      active,
      user_review_count,
      scraped_review_count,
      brewery:breweries!beers_brewery_id_fkey (
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

  // Get current user
  const { data: { user } } = await supabase.auth.getUser();

  // Fetch all flags for this beer
  const { data: allFlags } = await supabase
    .from('active_inactive_flags')
    .select('user_id, flag')
    .eq('beer_id', beerIdNum);

  // Calculate flag counts
  const activeCount = allFlags?.filter(f => f.flag === true).length || 0;
  const inactiveCount = allFlags?.filter(f => f.flag === false).length || 0;

  // Check if current user has flagged this beer
  const userFlag = user
    ? allFlags?.find(f => f.user_id === user.id)?.flag ?? null
    : null;

  // Get actual review count from user_ratings table
  const { count: actualReviewCount } = await supabase
    .from('user_ratings')
    .select('*', { count: 'exact', head: true })
    .eq('beer_id', beerIdNum);

  // Fetch similar beers based on embeddings
  const similarBeers = await getSimilarBeers(beerIdNum, 10, shouldShowInactive);

  // Combine beer data with flag info and actual review count
  const beerWithFlags = {
    ...beer,
    user_review_count: actualReviewCount || 0,
    flag_active: activeCount,
    flag_inactive: inactiveCount,
    user_flagged_active: userFlag,
    is_authenticated: !!user
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Beer Info Card */}
      <BeerInfoCard beer={beerWithFlags} />

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
