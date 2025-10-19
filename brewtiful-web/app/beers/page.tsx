import { createClient } from '@/utils/supabase/server';
import { BeerCard } from '@/components/beer-card';

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
      {/* Header Section */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Discover Beers</h1>
        <p className="text-muted-foreground">
          Explore {beers.length.toLocaleString()} craft beers from around the world
        </p>
      </div>

      {/* Responsive Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {beers.map((beer) => (
          <BeerCard
            key={beer.beer_id}
            name={beer.name}
            brewery={beer.brewery.name}
            style={beer.style}
            abv={beer.abv}
            location={beer.brewery.country}
            description={beer.description}
          />
        ))}
      </div>
    </div>
  );
}