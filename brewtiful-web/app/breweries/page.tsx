import { createClient } from '@/utils/supabase/server';
import { BreweriesView } from '@/components/breweries-view';
import { BreweriesPageLayout } from '@/components/breweries-page-layout';
import { BreweriesPagination } from '@/components/breweries-pagination';
import { BrewerySortOption, SortDirection } from '@/components/brewery-filters-sidebar';

const ITEMS_PER_PAGE = 24;

interface BreweriesPageProps {
  searchParams: Promise<{
    page?: string;
    q?: string;
    sort?: BrewerySortOption;
    direction?: SortDirection;
    countries?: string;
    cities?: string;
    provinceOrStates?: string;
  }>;
}

export default async function BreweriesPage({ searchParams }: BreweriesPageProps) {
  const supabase = await createClient();
  const params = await searchParams;

  // Get page from URL params, default to 1
  const currentPage = Number(params.page) || 1;
  const from = (currentPage - 1) * ITEMS_PER_PAGE;
  const to = from + ITEMS_PER_PAGE - 1;

  // Get sort and filter params
  const sortBy = params.sort || 'name';
  const sortDirection = params.direction || 'asc';
  const filterCountries = params.countries?.split(',').filter(Boolean) || [];
  const filterCities = params.cities?.split(',').filter(Boolean) || [];
  const filterProvinceOrStates = params.provinceOrStates?.split(',').filter(Boolean) || [];

  // Get search query
  const searchQuery = params.q?.trim();

  // Build query with search filter
  let countQuery = supabase
    .from("breweries")
    .select('*', { count: 'exact', head: true });

  let breweriesQuery = supabase
    .from("breweries")
    .select('*');

  // Apply search filter to both queries if present
  if (searchQuery) {
    countQuery = countQuery.ilike('name', `%${searchQuery}%`);
    breweriesQuery = breweriesQuery.ilike('name', `%${searchQuery}%`);
  }

  // Apply country filter
  if (filterCountries.length > 0) {
    countQuery = countQuery.in('country', filterCountries);
    breweriesQuery = breweriesQuery.in('country', filterCountries);
  }

  // Apply city filter
  if (filterCities.length > 0) {
    countQuery = countQuery.in('city', filterCities);
    breweriesQuery = breweriesQuery.in('city', filterCities);
  }

  // Apply province/state filter
  if (filterProvinceOrStates.length > 0) {
    countQuery = countQuery.in('province_or_state', filterProvinceOrStates);
    breweriesQuery = breweriesQuery.in('province_or_state', filterProvinceOrStates);
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
    case 'country':
      orderColumn = 'country';
      break;
    case 'city':
      orderColumn = 'city';
      break;
    default:
      orderColumn = 'name';
  }

  // Fetch breweries with pagination
  const { data: breweries, error } = await breweriesQuery
    .order(orderColumn, { ascending: orderAscending })
    .range(from, to);

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-red-500">Error loading breweries: {error.message}</p>
      </div>
    );
  }

  if (!breweries || breweries.length === 0) {
    return (
      <BreweriesPageLayout
        availableCountries={[]}
        availableCities={[]}
        availableProvinceOrStates={[]}
      >
        <h1 className="text-4xl font-bold mb-2">Discover Breweries</h1>
        <p className="text-muted-foreground">No breweries found.</p>
      </BreweriesPageLayout>
    );
  }

  // Get ALL breweries for filter options
  let optionsQuery = supabase
    .from("breweries")
    .select('country, city, province_or_state');

  // Apply search filter if present
  if (searchQuery) {
    optionsQuery = optionsQuery.ilike('name', `%${searchQuery}%`);
  }

  // Apply country filter
  if (filterCountries.length > 0) {
    optionsQuery = optionsQuery.in('country', filterCountries);
  }

  // Apply city filter
  if (filterCities.length > 0) {
    optionsQuery = optionsQuery.in('city', filterCities);
  }

  // Apply province/state filter
  if (filterProvinceOrStates.length > 0) {
    optionsQuery = optionsQuery.in('province_or_state', filterProvinceOrStates);
  }

  const { data: allOptionsBreweries } = await optionsQuery;

  // Calculate available options from the fully filtered set
  const availableCountries = Array.from(
    new Set(
      allOptionsBreweries
        ?.map((b) => b.country)
        .filter(Boolean) || []
    )
  ).sort() as string[];

  const availableCities = Array.from(
    new Set(
      allOptionsBreweries
        ?.map((b) => b.city)
        .filter(Boolean) || []
    )
  ).sort() as string[];

  const availableProvinceOrStates = Array.from(
    new Set(
      allOptionsBreweries
        ?.map((b) => b.province_or_state)
        .filter(Boolean) || []
    )
  ).sort() as string[];

  const totalPages = count ? Math.ceil(count / ITEMS_PER_PAGE) : 1;

  return (
    <BreweriesPageLayout
      availableCountries={availableCountries}
      availableCities={availableCities}
      availableProvinceOrStates={availableProvinceOrStates}
    >
      <h1 className="text-4xl font-bold mb-2">Discover Breweries</h1>
      <div className="mb-4 text-sm text-muted-foreground">
        Showing {from + 1}-{Math.min(to + 1, count || 0)} of {count || 0} breweries
        {searchQuery && ` matching "${searchQuery}"`}
      </div>
      <BreweriesView breweries={breweries} />
      <BreweriesPagination
        currentPage={currentPage}
        totalPages={totalPages}
      />
    </BreweriesPageLayout>
  );
}
