import { createClient } from '@/utils/supabase/server';
import { BeersView } from '@/components/beers-view';
import { BeersPagination } from '@/components/beers-pagination';

const ITEMS_PER_PAGE = 50;

interface BeersPageProps {
  searchParams: Promise<{ page?: string }>;
}

export default async function BeersPage({ searchParams }: BeersPageProps) {
  const supabase = await createClient();
  const params = await searchParams;

  // Get page from URL params, default to 1
  const currentPage = Number(params.page) || 1;
  const from = (currentPage - 1) * ITEMS_PER_PAGE;
  const to = from + ITEMS_PER_PAGE - 1;

  // Fetch total count for pagination
  const { count } = await supabase
    .from("beers")
    .select('*', { count: 'exact', head: true });

  // Fetch beers with pagination
  const { data: beers, error } = await supabase
    .from("beers")
    .select(`
      *,
      brewery:breweries (
      name,
      country
      )
    `)
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
      <div className="mb-4 text-sm text-muted-foreground">
        Showing {from + 1}-{Math.min(to + 1, count || 0)} of {count || 0} beers
      </div>

      <BeersView beers={beers} />

      <BeersPagination
        currentPage={currentPage}
        totalPages={totalPages}
      />
    </div>
  );
}