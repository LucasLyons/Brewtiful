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
  savedBeerIds?: Set<number>;
  userRatings?: Map<number, number>;
  onBeerUnrated?: (beerId: number) => void;
  onBeerSaved?: (beerId: number) => void;
  onBeerUnsaved?: (beerId: number) => void;
  onBeerRated?: (beerId: number, rating: number) => void;
  hideSearch?: boolean; // Add option to hide search for profile page
}

export function BeersView({ beers, paginationTop, savedBeerIds, userRatings, onBeerUnrated, onBeerSaved, onBeerUnsaved, onBeerRated, hideSearch = false }: BeersViewProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [isLoading, setIsLoading] = useState(true);

  // Load saved preference after mount to avoid hydration mismatch
  useEffect(() => {
    const savedView = localStorage.getItem("beerViewMode") as ViewMode | null;

    // Check if we're on mobile/tablet (< 768px = md breakpoint)
    const isMobile = window.innerWidth < 768;

    // Force grid view on mobile, otherwise use saved preference
    if (isMobile) {
      setViewMode("grid");
    } else if (savedView === "grid" || savedView === "table") {
      setViewMode(savedView);
    }
    setIsLoading(false);

    // Handle window resize to force grid view on mobile
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setViewMode("grid");
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
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
      <div className="mb-4 sm:mb-6 lg:mb-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
        {!hideSearch && (
          <div className="flex-1">
            <BeerSearch />
          </div>
        )}
        <ViewToggle currentView={viewMode} onViewChange={setViewMode} />
      </div>

      {/* Pagination (Top) */}
      {paginationTop && (
        <div className="mb-4 sm:mb-6">
          {paginationTop}
        </div>
      )}

      {/* Conditional Rendering Based on View Mode */}
      {viewMode === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
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
              isSaved={savedBeerIds ? savedBeerIds.has(parseInt(beer.beer_id)) : false}
              initialRating={userRatings?.get(parseInt(beer.beer_id)) ?? null}
              onUnrated={onBeerUnrated}
              onSaved={onBeerSaved}
              onUnsaved={onBeerUnsaved}
              onRated={onBeerRated}
            />
          ))}
        </div>
      ) : (
        <BeerTable beers={beers} savedBeerIds={savedBeerIds} userRatings={userRatings} onBeerUnrated={onBeerUnrated} onBeerSaved={onBeerSaved} onBeerUnsaved={onBeerUnsaved} onBeerRated={onBeerRated} />
      )}
    </>
  );
}
