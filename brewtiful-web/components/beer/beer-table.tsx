import { BeerListItem } from "./beer-list-item";

interface Beer {
  beer_id: string;
  brewery_id: number;
  name: string;
  style: string;
  abv?: number;
  description?: string;
  active?: 'Active' | 'Inactive' | 'Unknown';
  brewery: {
    name: string;
    country?: string;
    city?: string;
  };
}

interface BeerTableProps {
  beers: Beer[];
  savedBeerIds?: Set<number>;
  userRatings?: Map<number, number>;
  onBeerUnrated?: (beerId: number) => void;
  onBeerSaved?: (beerId: number) => void;
  onBeerUnsaved?: (beerId: number) => void;
  onBeerRated?: (beerId: number, rating: number) => void;
}

export function BeerTable({ beers, savedBeerIds, userRatings, onBeerUnrated, onBeerSaved, onBeerUnsaved, onBeerRated }: BeerTableProps) {
  return (
    <div className="rounded-lg border bg-card shadow">
      {/* Table Header */}
      <div className="grid grid-cols-14 gap-4 px-4 py-3 bg-muted/50 border-b font-medium text-sm">
        <div className="col-span-2">Name</div>
        <div className="col-span-2">Brewery</div>
        <div className="col-span-2">Style</div>
        <div className="col-span-1 text-center">ABV</div>
        <div className="col-span-1 text-center">Status</div>
        <div className="col-span-1">Country</div>
        <div className="col-span-1">City</div>
        <div className="col-span-2">Description</div>
        <div className="col-span-1 text-center">Rating</div>
        <div className="col-span-1 text-center">Save</div>
      </div>

      {/* Table Body */}
      <div>
        {beers.map((beer) => (
          <BeerListItem
            key={beer.beer_id}
            beerId={beer.beer_id}
            name={beer.name}
            brewery={beer.brewery.name}
            breweryId={beer.brewery_id}
            style={beer.style}
            abv={beer.abv}
            country={beer.brewery.country}
            city={beer.brewery.city}
            description={beer.description}
            active={beer.active}
            isSaved={savedBeerIds ? savedBeerIds.has(parseInt(beer.beer_id)) : false}
            initialRating={userRatings?.get(parseInt(beer.beer_id)) ?? null}
            onUnrated={onBeerUnrated}
            onSaved={onBeerSaved}
            onUnsaved={onBeerUnsaved}
            onRated={onBeerRated}
          />
        ))}
      </div>
    </div>
  );
}
