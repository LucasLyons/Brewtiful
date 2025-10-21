"use client";

import { useState } from "react";
import { BeerCard } from "./beer-card";
import { BreweryBeersFilters } from "./brewery-beers-filters";

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
  };
}

interface BreweryBeersViewProps {
  beers: Beer[];
  availableStyles: string[];
}

export function BreweryBeersView({ beers, availableStyles }: BreweryBeersViewProps) {
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  return (
    <>
      <BreweryBeersFilters
        availableStyles={availableStyles}
        isOpen={isFilterOpen}
        onToggle={() => setIsFilterOpen(!isFilterOpen)}
      />

      <div className={`transition-all duration-300 ${isFilterOpen ? 'ml-64' : 'ml-0'}`}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {beers.map((beer) => (
            <BeerCard
              key={beer.beer_id}
              name={beer.name}
              brewery={beer.brewery.name}
              breweryId={beer.brewery_id}
              style={beer.style}
              abv={beer.abv}
              location={beer.brewery.country}
              description={beer.description}
            />
          ))}
        </div>
      </div>
    </>
  );
}
