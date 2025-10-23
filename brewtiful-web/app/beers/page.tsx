import { createClient } from '@/utils/supabase/server';
import { BeersView } from '@/components/beers-view';
import { BeersPagination } from '@/components/beers-pagination';
import { BeersPageLayout } from '@/components/beers-page-layout';
import { SortOption, SortDirection } from '@/components/beer-filters-sidebar';


const ITEMS_PER_PAGE = 24;

interface BeersPageProps {
  searchParams: Promise<{
    page?: string;
    q?: string;
    sort?: SortOption;
    direction?: SortDirection;
    breweries?: string;
    styles?: string;
    locations?: string;
    cities?: string;
    abvMin?: string;
    abvMax?: string;
  }>;
}

export default async function BeersPage({ searchParams }: BeersPageProps) {
  const supabase = await createClient();
  const params = await searchParams;

  // Get page from URL params, default to 1
  const currentPage = Number(params.page) || 1;
  const from = (currentPage - 1) * ITEMS_PER_PAGE;
  const to = from + ITEMS_PER_PAGE - 1;

  // Get sort and filter params
  const sortBy = params.sort || 'popularity';
  const sortDirection = params.direction || 'desc';
  const filterBreweries = params.breweries?.split(',').filter(Boolean) || [];
  const filterStyles = params.styles?.split(',').filter(Boolean) || [];
  const filterLocations = params.locations?.split(',').filter(Boolean) || [];
  const filterCities = params.cities?.split(',').filter(Boolean) || [];
  const abvMin = params.abvMin ? parseFloat(params.abvMin) : undefined;
  const abvMax = params.abvMax ? parseFloat(params.abvMax) : undefined;

  // Get search query
  const searchQuery = params.q?.trim();

  // Find brewery IDs for search query
  let searchBreweryIds: string[] = [];
  if (searchQuery) {
    const { data: matchingBreweries } = await supabase
      .from("breweries")
      .select('brewery_id')
      .ilike('name', `%${searchQuery}%`);

    searchBreweryIds = matchingBreweries?.map(b => b.brewery_id) || [];
  }

  // Find brewery IDs for brewery filter
  let filterBreweryIds: string[] = [];
  if (filterBreweries.length > 0) {
    const { data: selectedBreweries } = await supabase
      .from("breweries")
      .select('brewery_id')
      .in('name', filterBreweries);

    filterBreweryIds = selectedBreweries?.map(b => b.brewery_id) || [];
  }

  // Find brewery IDs for location filter
  let locationBreweryIds: string[] = [];
  if (filterLocations.length > 0) {
    const { data: breweriesInLocations } = await supabase
      .from("breweries")
      .select('brewery_id')
      .in('country', filterLocations);

    locationBreweryIds = breweriesInLocations?.map(b => b.brewery_id) || [];
  }

  // Find brewery IDs for city filter
  let cityBreweryIds: string[] = [];
  if (filterCities.length > 0) {
    const { data: breweriesInCities } = await supabase
      .from("breweries")
      .select('brewery_id')
      .in('city', filterCities);

    cityBreweryIds = breweriesInCities?.map(b => b.brewery_id) || [];
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
      country,
      city
      )
    `);

  // Apply search filter to both queries if present
  if (searchQuery) {
     // Search in beer name OR brewery_id matches our found breweries
    if (searchBreweryIds.length > 0) {
      countQuery = countQuery.or(`name.ilike.%${searchQuery}%,brewery_id.in.(${searchBreweryIds.join(',')})`);
      beersQuery = beersQuery.or(`name.ilike.%${searchQuery}%,brewery_id.in.(${searchBreweryIds.join(',')})`);
    } else {
      // If no breweries match, just search beer names
      countQuery = countQuery.ilike('name', `%${searchQuery}%`);
      beersQuery = beersQuery.ilike('name', `%${searchQuery}%`);
    }
  }

  // Apply brewery filter at database level
  if (filterBreweryIds.length > 0) {
    countQuery = countQuery.in('brewery_id', filterBreweryIds);
    beersQuery = beersQuery.in('brewery_id', filterBreweryIds);
  }

  // Apply location filter at database level (via brewery IDs)
  if (locationBreweryIds.length > 0) {
    countQuery = countQuery.in('brewery_id', locationBreweryIds);
    beersQuery = beersQuery.in('brewery_id', locationBreweryIds);
  }

  // Apply city filter at database level (via brewery IDs)
  if (cityBreweryIds.length > 0) {
    countQuery = countQuery.in('brewery_id', cityBreweryIds);
    beersQuery = beersQuery.in('brewery_id', cityBreweryIds);
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

  // For brewery and location filters, we need to handle the joined data
  // We'll apply these filters after fetching

  // Fetch total count for pagination (this will be approximate for brewery/location filters)
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
    case 'brewery':
    case 'country':
    case 'city':
      // We'll sort these after fetching since they're in the joined table
      orderColumn = 'name'; // Default sort for now
      break;
    default:
      orderColumn = 'name';
  }

  // Fetch beers with pagination
  const { data: beers, error } = await beersQuery
    .order(orderColumn, { ascending: orderAscending })
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
      <BeersPageLayout
        availableBreweries={[]}
        availableStyles={[]}
        availableLocations={[]}
        availableCities={[]}
      >
        <p className="text-muted-foreground">No beers found.</p>
      </BeersPageLayout>
    );
  }

  // Apply client-side sorting for brewery, country, and city
  let filteredBeers = beers;
  if (sortBy === 'brewery') {
    filteredBeers = [...filteredBeers].sort((a, b) => {
      const comparison = a.brewery.name.localeCompare(b.brewery.name);
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  } else if (sortBy === 'country') {
    filteredBeers = [...filteredBeers].sort((a, b) => {
      const aCountry = a.brewery.country || '';
      const bCountry = b.brewery.country || '';
      const comparison = aCountry.localeCompare(bCountry);
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  } else if (sortBy === 'city') {
    filteredBeers = [...filteredBeers].sort((a, b) => {
      const aCity = a.brewery.city || '';
      const bCity = b.brewery.city || '';
      const comparison = aCity.localeCompare(bCity);
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }

  // Get ALL beers with brewery data for filter options
  // We apply database-level filters (search, ABV, styles) only
  // Then apply brewery/location filters client-side
  let optionsQuery = supabase
    .from("beers")
    .select(`
      style,
      brewery:breweries (
        name,
        country,
        city
      )
    `);

  // Apply search filter if present (database level)
  if (searchQuery) {
    if (searchBreweryIds.length > 0) {
      optionsQuery = optionsQuery.or(`name.ilike.%${searchQuery}%,brewery_id.in.(${searchBreweryIds.join(',')})`);
    } else {
      optionsQuery = optionsQuery.ilike('name', `%${searchQuery}%`);
    }
  }

  // Apply brewery filter at database level for options
  if (filterBreweryIds.length > 0) {
    optionsQuery = optionsQuery.in('brewery_id', filterBreweryIds);
  }

  // Apply location filter at database level for options
  if (locationBreweryIds.length > 0) {
    optionsQuery = optionsQuery.in('brewery_id', locationBreweryIds);
  }

  // Apply city filter at database level for options
  if (cityBreweryIds.length > 0) {
    optionsQuery = optionsQuery.in('brewery_id', cityBreweryIds);
  }

  // Apply ABV filters (database level)
  if (abvMin !== undefined) {
    optionsQuery = optionsQuery.gte('abv', abvMin);
  }
  if (abvMax !== undefined) {
    optionsQuery = optionsQuery.lte('abv', abvMax);
  }

  // DON'T apply style filter yet - we need to see all styles available for the selected breweries/locations

  const { data: allOptionsBeers } = await optionsQuery;

  // Now apply style filter client-side to determine what options are actually available
  // (brewery and location are already applied at database level)
  interface BeerWithBrewery {
    style: string;
    brewery: {
      name: string;
      country?: string;
      city?: string;
    } | {
      name: string;
      country?: string;
      city?: string;
    }[];
  }

  let availableBeersForOptions: BeerWithBrewery[] = allOptionsBeers || [];

  // Apply style filter client-side
  if (filterStyles.length > 0) {
    availableBeersForOptions = availableBeersForOptions.filter((b) =>
      filterStyles.includes(b.style)
    );
  }

  // Calculate available options from the fully filtered set
  const availableBreweries = Array.from(
    new Set(
      availableBeersForOptions
        ?.map((b) => (Array.isArray(b.brewery) ? b.brewery[0]?.name : b.brewery?.name))
        .filter(Boolean) || []
    )
  ).sort() as string[];

  const availableStyles = Array.from(
    new Set(availableBeersForOptions?.map((b) => b.style).filter(Boolean) || [])
  ).sort() as string[];

  const availableLocations = Array.from(
    new Set(
      availableBeersForOptions
        ?.map((b) => (Array.isArray(b.brewery) ? b.brewery[0]?.country : b.brewery?.country))
        .filter(Boolean) || []
    )
  ).sort() as string[];

  const availableCities = Array.from(
    new Set(
      availableBeersForOptions
        ?.map((b) => (Array.isArray(b.brewery) ? b.brewery[0]?.city : b.brewery?.city))
        .filter(Boolean) || []
    )
  ).sort() as string[];

  const totalPages = count ? Math.ceil(count / ITEMS_PER_PAGE) : 1;


  return (
    <BeersPageLayout
      availableBreweries={availableBreweries}
      availableStyles={availableStyles}
      availableLocations={availableLocations}
      availableCities={availableCities}
    >
      <h1 className="text-4xl font-bold mb-2">Discover Beers</h1>
      <div className="mb-4 text-sm text-muted-foreground">
        Showing {from + 1}-{Math.min(to + 1, count || 0)} of {count || 0} beers
        {searchQuery && ` matching "${searchQuery}"`}
      </div>
      <BeersView
        beers={filteredBeers}
        paginationTop={
          <BeersPagination
            currentPage={currentPage}
            totalPages={totalPages}
          />
        }
      />
      <BeersPagination
        currentPage={currentPage}
        totalPages={totalPages}
      />
    </BeersPageLayout>
  );
}