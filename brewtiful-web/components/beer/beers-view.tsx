"use client";

import { useState, useEffect } from "react";
import { BeerCard } from "@/components/beer/beer-card";
import { BeerTable } from "@/components/beer/beer-table";
import { ViewMode, ViewToggle } from "@/components/layout/view-toggle";
import { BeerSearch } from "@/components/beer/beer-search";

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

interface BeersViewProps {
  beers: Beer[];
  paginationTop?: React.ReactNode;
}

export function BeersView({ beers, paginationTop }: BeersViewProps) {
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
      {/* Header Section with Search and View Toggle */}
      <div className="mb-8 flex items-center gap-4">
        <div className="flex-1">
          <BeerSearch />
        </div>
        <ViewToggle currentView={viewMode} onViewChange={setViewMode} />
      </div>

      {/* Pagination (Top) */}
      {paginationTop && (
        <div className="mb-6">
          {paginationTop}
        </div>
      )}

      {/* Conditional Rendering Based on View Mode */}
      {viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {beers.map((beer) => (
            <BeerCard
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
            />
          ))}
        </div>
      ) : (
        <BeerTable beers={beers} />
      )}
    </>
  );
}
