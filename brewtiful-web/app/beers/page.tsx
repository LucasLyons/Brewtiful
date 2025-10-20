import { createClient } from '@/utils/supabase/server';
import { BeersView } from '@/components/beers-view';

export default async function BeersPage() {
  const supabase = await createClient();
  
  // Fetch beers from Supabase with error handling
  const { data: beers, error } = await supabase
    .from("beers")
    .select(`
      *,
      brewery:breweries (
      name,
      country
      )
    `)
    .order('scraped_review_count', { ascending: false }) // Sort by highest rated
    .limit(50); // Limit for performance

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

  return (
    <div className="container mx-auto px-4 py-8">
      <BeersView beers={beers} />
    </div>
  );
}