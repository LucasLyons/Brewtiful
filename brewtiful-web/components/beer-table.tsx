import { BeerListItem } from "./beer-list-item";

interface Beer {
  beer_id: string;
  name: string;
  style: string;
  abv?: number;
  description?: string;
  brewery: {
    name: string;
    country?: string;
  };
}

interface BeerTableProps {
  beers: Beer[];
}

export function BeerTable({ beers }: BeerTableProps) {
  return (
    <div className="rounded-lg border bg-card shadow">
      {/* Table Header */}
      <div className="grid grid-cols-6 gap-4 px-4 py-3 bg-muted/50 border-b font-medium text-sm">
        <div className="col-span-1">Name</div>
        <div className="col-span-1">Brewery</div>
        <div className="col-span-1">Style</div>
        <div className="col-span-1 text-center">ABV</div>
        <div className="col-span-1">Location</div>
        <div className="col-span-1">Description</div>
      </div>

      {/* Table Body */}
      <div>
        {beers.map((beer) => (
          <BeerListItem
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
