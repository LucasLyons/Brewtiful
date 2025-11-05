import { createClient } from '@/utils/supabase/server';
import { notFound } from 'next/navigation';
import { BreweryInfoCard } from '@/components/brewery/brewery-info-card';
import { BreweryBeersSection } from '@/components/brewery/brewery-beers-section';
import { trackBreweryView } from '@/lib/events/track-view';

interface BreweryDetailPageProps {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    page?: string;
    q?: string;
    sort?: string;
    direction?: string;
    styles?: string;
    abvMin?: string;
    abvMax?: string;
  }>;
}

export default async function BreweryDetailPage({ params, searchParams }: BreweryDetailPageProps) {
  const supabase = await createClient();
  const { id } = await params;
  const queryParams = await searchParams;

  // Convert id to number since brewery_id is stored as integer
  const breweryIdNum = parseInt(id, 10);

  // Fetch brewery details
  const { data: brewery, error: breweryError } = await supabase
    .from('breweries')
    .select('*')
    .eq('brewery_id', breweryIdNum)
    .single();

  if (breweryError || !brewery) {
    notFound();
  }

  // Get current user for view tracking
  const { data: { user } } = await supabase.auth.getUser();

  // Track view event for authenticated users
  if (user) {
    // Fire and forget - don't await to avoid blocking page render
    trackBreweryView({
      breweryId: breweryIdNum,
      userId: user.id
    }).catch(err => {
      console.error('Failed to track brewery view:', err);
    });
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Brewery Info Card */}
      <BreweryInfoCard brewery={brewery} />

      {/* Brewery Beers Section */}
      <BreweryBeersSection
        breweryId={id}
        breweryName={brewery.name}
        searchParams={queryParams}
      />
    </div>
  );
}
