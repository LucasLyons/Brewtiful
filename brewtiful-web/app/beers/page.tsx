import { createClient } from '@/utils/supabase/server';
import { BeersView } from '@/components/beers-view';
import { BeersPagination } from '@/components/beers-pagination';


const ITEMS_PER_PAGE = 24;

interface BeersPageProps {
  searchParams: Promise<{ page?: string; q?: string }>;
}

export default async function BeersPage({ searchParams }: BeersPageProps) {
  const supabase = await createClient();
  const params = await searchParams;

  // Get page from URL params, default to 1
  const currentPage = Number(params.page) || 1;
  const from = (currentPage - 1) * ITEMS_PER_PAGE;
  const to = from + ITEMS_PER_PAGE - 1;

  // Get search query
  const searchQuery = params.q?.trim();
  // If there's a search query, we need to find matching brewery IDs first
  let breweryIds: string[] = [];
  if (searchQuery) {
    const { data: matchingBreweries } = await supabase
      .from("breweries")
      .select('brewery_id')
      .ilike('name', `%${searchQuery}%`);

    breweryIds = matchingBreweries?.map(b => b.brewery_id) || [];
  }

  // Build query with search filter
  let countQuery = supabase
    .from("beers")
    .select('*', { count: 'exact', head: true });

  let beersQuery = supabase
    .from("beers")
    .select(`
      *,
      brewery:breweries (
      name,
      country
      )
    `);

  // Apply search filter to both queries if present
  if (searchQuery) {
     // Search in beer name OR brewery_id matches our found breweries
    if (breweryIds.length > 0) {
      countQuery = countQuery.or(`name.ilike.%${searchQuery}%,brewery_id.in.(${breweryIds.join(',')})`);
      beersQuery = beersQuery.or(`name.ilike.%${searchQuery}%,brewery_id.in.(${breweryIds.join(',')})`);
    } else {
      // If no breweries match, just search beer names
      countQuery = countQuery.ilike('name', `%${searchQuery}%`);
      beersQuery = beersQuery.ilike('name', `%${searchQuery}%`);
    }
  }
  // Fetch total count for pagination
  const { count } = await countQuery;

  // Fetch beers with pagination
  const { data: beers, error } = await beersQuery
    .order('scraped_review_count', { ascending: false })
    .range(from, to);

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-red-500">Error loading beers: {error.message}</p>
      </div>
    );
  }

  if (!beers || beers.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-muted-foreground">No beers found.</p>
      </div>
    );
  }

  const totalPages = count ? Math.ceil(count / ITEMS_PER_PAGE) : 1;
  

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-2">Discover Beers</h1>
      <div className="mb-4 text-sm text-muted-foreground">
        Showing {from + 1}-{Math.min(to + 1, count || 0)} of {count || 0} beers
        {searchQuery && ` matching "${searchQuery}"`}
      </div>
      <BeersView beers={beers} />
      <BeersPagination
        currentPage={currentPage}
        totalPages={totalPages}
      />
    </div>
  );
}