"use client";

import { useRef } from "react";
import { BeerCard } from "@/components/beer-card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Brewery {
  brewery_id: number;
  name: string;
  country?: string;
  province_or_state?: string;
  city?: string;
}

interface SimilarBeer {
  beer_id: number;
  name: string;
  style: string;
  abv?: number;
  description?: string;
  active: 'Active' | 'Inactive' | 'Unknown';
  similarity: number;
  brewery: Brewery | Brewery[];
}

interface SimilarBeersProps {
  beers: SimilarBeer[];
}

export function SimilarBeers({ beers }: SimilarBeersProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 400; // Width of approximately one card
      const newScrollLeft = scrollContainerRef.current.scrollLeft +
        (direction === 'left' ? -scrollAmount : scrollAmount);

      scrollContainerRef.current.scrollTo({
        left: newScrollLeft,
        behavior: 'smooth'
      });
    }
  };

  if (!beers || beers.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Similar Beers</h2>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => scroll('left')}
            aria-label="Scroll left"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => scroll('right')}
            aria-label="Scroll right"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div
        ref={scrollContainerRef}
        className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth pb-4"
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        {beers.map((beer) => {
          // Handle brewery being an array (from Supabase join)
          const brewery = Array.isArray(beer.brewery)
            ? beer.brewery[0]
            : beer.brewery;

          return (
            <div key={beer.beer_id} className="flex-none w-80">
              <BeerCard
                beerId={String(beer.beer_id)}
                name={beer.name}
                brewery={brewery.name}
                breweryId={brewery.brewery_id}
                style={beer.style}
                abv={beer.abv}
                country={brewery.country}
                city={brewery.city}
                description={beer.description}
                active={beer.active}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
