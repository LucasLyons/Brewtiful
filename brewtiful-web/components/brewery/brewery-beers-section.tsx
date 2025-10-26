import { createClient } from '@/utils/supabase/server';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BreweryBeersView } from '@/components/brewery/brewery-beers-view';
import { BeersPagination } from '@/components/beer/beers-pagination';
import { SortOption, SortDirection } from '@/components/beer/beer-filters-sidebar';

const ITEMS_PER_PAGE = 12; // Smaller page size for brewery-specific view

interface BreweryBeersSectionProps {
  breweryId: string;
  breweryName: string;
  searchParams: {
    page?: string;
    q?: string;
    sort?: string;
    direction?: string;
    styles?: string;
    abvMin?: string;
    abvMax?: string;
  };
}

export async function BreweryBeersSection({
  breweryId,
  breweryName,
  searchParams,
}: BreweryBeersSectionProps) {
  const supabase = await createClient();

  // Convert breweryId to number since the database stores it as integer
  const breweryIdNum = parseInt(breweryId, 10);

  // Get page from URL params, default to 1
  const currentPage = Number(searchParams.page) || 1;
  const from = (currentPage - 1) * ITEMS_PER_PAGE;
  const to = from + ITEMS_PER_PAGE - 1;

  // Get sort and filter params
  const sortBy = (searchParams.sort as SortOption) || 'popularity';
  const sortDirection = (searchParams.direction as SortDirection) || 'desc';
  const filterStyles = searchParams.styles?.split(',').filter(Boolean) || [];
  const abvMin = searchParams.abvMin ? parseFloat(searchParams.abvMin) : undefined;
  const abvMax = searchParams.abvMax ? parseFloat(searchParams.abvMax) : undefined;

  // Get search query
  const searchQuery = searchParams.q?.trim();

  // Build query with brewery_id filter
  let countQuery = supabase
    .from("beers")
    .select('*', { count: 'exact', head: true })
    .eq('brewery_id', breweryIdNum);

  let beersQuery = supabase
    .from("beers")
    .select(`
      *,
      brewery:breweries!beers_brewery_id_fkey (
        name,
        country,
        city
      )
    `)
    .eq('brewery_id', breweryIdNum);

  // Apply search filter to both queries if present
  if (searchQuery) {
    countQuery = countQuery.ilike('name', `%${searchQuery}%`);
    beersQuery = beersQuery.ilike('name', `%${searchQuery}%`);
  }

  // Apply style filters
  if (filterStyles.length > 0) {
    countQuery = countQuery.in('style', filterStyles);
    beersQuery = beersQuery.in('style', filterStyles);
  }

  // Apply ABV range filters
  if (abvMin !== undefined) {
    countQuery = countQuery.gte('abv', abvMin);
    beersQuery = beersQuery.gte('abv', abvMin);
  }
  if (abvMax !== undefined) {
    countQuery = countQuery.lte('abv', abvMax);
    beersQuery = beersQuery.lte('abv', abvMax);
  }

  // Fetch total count for pagination
  const { count } = await countQuery;

  // Apply sorting
  let orderColumn: string;
  const orderAscending = sortDirection === 'asc';

  switch (sortBy) {
    case 'name':
      orderColumn = 'name';
      break;
    case 'style':
      orderColumn = 'style';
      break;
    case 'abv':
      orderColumn = 'abv';
      break;
    case 'popularity':
      orderColumn = 'scraped_review_count';
      break;
    default:
      orderColumn = 'scraped_review_count';
  }

  // Fetch beers with pagination
  const { data: beers, error } = await beersQuery
    .order(orderColumn, { ascending: orderAscending })
    .range(from, to);

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Beers from {breweryName}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-500">Error loading beers: {error.message}</p>
        </CardContent>
      </Card>
    );
  }

  // Get ALL beers from this brewery for filter options (styles only)
  let optionsQuery = supabase
    .from("beers")
    .select('style')
    .eq('brewery_id', breweryIdNum);

  // Apply search filter if present
  if (searchQuery) {
    optionsQuery = optionsQuery.ilike('name', `%${searchQuery}%`);
  }

  // Apply ABV filters
  if (abvMin !== undefined) {
    optionsQuery = optionsQuery.gte('abv', abvMin);
  }
  if (abvMax !== undefined) {
    optionsQuery = optionsQuery.lte('abv', abvMax);
  }

  const { data: allOptionsBeers } = await optionsQuery;

  // Calculate available styles from the brewery's beers
  const availableStyles = Array.from(
    new Set(allOptionsBeers?.map((b) => b.style).filter(Boolean) || [])
  ).sort() as string[];

  const totalPages = count ? Math.ceil(count / ITEMS_PER_PAGE) : 1;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Beers from {breweryName}</CardTitle>
        <div className="text-sm text-muted-foreground">
          {count ? `${count} beer${count !== 1 ? 's' : ''} found` : 'No beers found'}
          {searchQuery && ` matching "${searchQuery}"`}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {beers && beers.length > 0 ? (
          <>
            <BreweryBeersView
              beers={beers}
              availableStyles={availableStyles}
            />
            {totalPages > 1 && (
              <BeersPagination
                currentPage={currentPage}
                totalPages={totalPages}
              />
            )}
          </>
        ) : (
          <p className="text-muted-foreground">No beers found for this brewery.</p>
        )}
      </CardContent>
    </Card>
  );
}
