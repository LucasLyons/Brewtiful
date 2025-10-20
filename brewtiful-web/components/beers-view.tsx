"use client";

import { useState, useEffect } from "react";
import { BeerCard } from "./beer-card";
import { BeerTable } from "./beer-table";
import { ViewToggle, ViewMode } from "./view-toggle";

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

interface BeersViewProps {
  beers: Beer[];
}

export function BeersView({ beers }: BeersViewProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [isLoading, setIsLoading] = useState(true);

  // Load saved preference after mount to avoid hydration mismatch
  useEffect(() => {
    const savedView = localStorage.getItem("beerViewMode") as ViewMode | null;
    if (savedView === "grid" || savedView === "table") {
      setViewMode(savedView);
    }
    setIsLoading(false);
  }, []);

  if (isLoading) {
    return (
      <>
        {/* Header Section */}
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2">Discover Beers</h1>
            <p className="text-muted-foreground">
              Explore {beers.length.toLocaleString()} craft beers from around the world
            </p>
          </div>
          {/* Skeleton for View Toggle */}
          <div className="h-10 w-[180px] bg-muted/50 rounded-lg animate-pulse" />
        </div>

        {/* Loading Skeleton - Grid View */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="rounded-xl border bg-card shadow h-[300px] animate-pulse">
              <div className="p-6 space-y-4">
                <div className="h-6 bg-muted rounded w-3/4" />
                <div className="h-4 bg-muted rounded w-1/2" />
                <div className="h-20 bg-muted rounded" />
              </div>
            </div>
          ))}
        </div>
      </>
    );
  }

  return (
    <>
      {/* Header Section with View Toggle */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-4xl font-bold mb-2">Discover Beers</h1>
          <p className="text-muted-foreground">
            Explore {beers.length.toLocaleString()} craft beers from around the world
          </p>
        </div>
        <ViewToggle currentView={viewMode} onViewChange={setViewMode} />
      </div>

      {/* Conditional Rendering Based on View Mode */}
      {viewMode === "grid" ? (
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
      ) : (
        <BeerTable beers={beers} />
      )}
    </>
  );
}
