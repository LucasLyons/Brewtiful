import { BeerListItem } from "./beer-list-item";

interface Beer {
  beer_id: string;
  brewery_id: number;
  name: string;
  style: string;
  abv?: number;
  description?: string;
  brewery: {
    name: string;
    country?: string;
    city?: string;
  };
}

interface BeerTableProps {
  beers: Beer[];
}

export function BeerTable({ beers }: BeerTableProps) {
  return (
    <div className="rounded-lg border bg-card shadow">
      {/* Table Header */}
      <div className="grid grid-cols-12 gap-4 px-4 py-3 bg-muted/50 border-b font-medium text-sm">
        <div className="col-span-2">Name</div>
        <div className="col-span-2">Brewery</div>
        <div className="col-span-2">Style</div>
        <div className="col-span-1 text-center">ABV</div>
        <div className="col-span-1">Country</div>
        <div className="col-span-1">City</div>
        <div className="col-span-3">Description</div>
      </div>

      {/* Table Body */}
      <div>
        {beers.map((beer) => (
          <BeerListItem
            key={beer.beer_id}
            name={beer.name}
            brewery={beer.brewery.name}
            breweryId={beer.brewery_id}
            style={beer.style}
            abv={beer.abv}
            country={beer.brewery.country}
            city={beer.brewery.city}
            description={beer.description}
          />
        ))}
      </div>
    </div>
  );
}
