"use client";

import { BreweryListItem } from "./brewery-list-item";
import { BrewerySearch } from "./brewery-search";

interface Brewery {
  brewery_id: string;
  name: string;
  country?: string;
  province_or_state?: string;
  city?: string;
}

interface BreweriesViewProps {
  breweries: Brewery[];
  paginationTop?: React.ReactNode;
  savedBreweryIds?: Set<number>;
  onBrewerySaved?: (breweryId: number) => void;
  onBreweryUnsaved?: (breweryId: number) => void;
  hideSearch?: boolean; // Add option to hide search for profile page
}

export function BreweriesView({ breweries, paginationTop, savedBreweryIds, onBrewerySaved, onBreweryUnsaved, hideSearch = false }: BreweriesViewProps) {
  return (
    <>
      {/* Header Section with Search */}
      {!hideSearch && (
        <div className="mb-8">
          <BrewerySearch />
        </div>
      )}

      {/* Pagination (Top) */}
      {paginationTop && (
        <div className="mb-6">
          {paginationTop}
        </div>
      )}

      {/* List Header */}
      <div className="grid grid-cols-13 gap-4 px-4 py-3 bg-muted/50 border-b font-semibold text-sm">
        <div className="col-span-3">Name</div>
        <div className="col-span-3">Country</div>
        <div className="col-span-3">Province/State</div>
        <div className="col-span-3">City</div>
        <div className="col-span-1 text-center">Save</div>
      </div>

      {/* Brewery List */}
      <div className="border rounded-lg overflow-hidden">
        {breweries.map((brewery) => (
          <BreweryListItem
            key={brewery.brewery_id}
            breweryId={brewery.brewery_id}
            name={brewery.name}
            country={brewery.country}
            provinceOrState={brewery.province_or_state}
            city={brewery.city}
            isSaved={savedBreweryIds ? savedBreweryIds.has(parseInt(brewery.brewery_id)) : false}
            onSaved={onBrewerySaved}
            onUnsaved={onBreweryUnsaved}
          />
        ))}
      </div>
    </>
  );
}
