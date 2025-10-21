"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronLeft, SlidersHorizontal, Search } from "lucide-react";

export type BrewerySortOption = "name" | "style" | "abv" | "popularity";
export type SortDirection = "asc" | "desc";

interface BreweryBeersFiltersProps {
  availableStyles?: string[];
  isOpen: boolean;
  onToggle: () => void;
}

export function BreweryBeersFilters({
  availableStyles = [],
  isOpen,
  onToggle,
}: BreweryBeersFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Search state
  const [searchQuery, setSearchQuery] = useState("");

  // Sort state
  const [sortBy, setSortBy] = useState<BrewerySortOption>("popularity");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  // Filter state
  const [selectedStyles, setSelectedStyles] = useState<string[]>([]);
  const [abvMin, setAbvMin] = useState<string>("");
  const [abvMax, setAbvMax] = useState<string>("");

  // Initialize from URL params
  useEffect(() => {
    const q = searchParams.get("q");
    const sort = searchParams.get("sort") as BrewerySortOption | null;
    const direction = searchParams.get("direction") as SortDirection | null;
    const styles = searchParams.get("styles");
    const minAbv = searchParams.get("abvMin");
    const maxAbv = searchParams.get("abvMax");

    if (q) setSearchQuery(q);
    if (sort) setSortBy(sort);
    if (direction) setSortDirection(direction);
    if (styles) setSelectedStyles(styles.split(","));
    if (minAbv) setAbvMin(minAbv);
    if (maxAbv) setAbvMax(maxAbv);
  }, [searchParams]);

  const resetFilters = () => {
    // Clear all state
    setSearchQuery("");
    setSelectedStyles([]);
    setAbvMin("");
    setAbvMax("");

    const params = new URLSearchParams(searchParams.toString());
    // Keep sort and direction, only delete filter params
    params.delete("q");
    params.delete("styles");
    params.delete("abvMin");
    params.delete("abvMax");
    params.set("page", "1");

    router.push(`${pathname}?${params.toString()}`);
  };

  const applyFiltersToUrl = (updates: {
    q?: string;
    sortBy?: BrewerySortOption;
    sortDirection?: SortDirection;
    styles?: string[];
    abvMin?: string;
    abvMax?: string;
  }) => {
    const params = new URLSearchParams(searchParams.toString());

    // Apply updates
    const finalQuery = updates.q !== undefined ? updates.q : searchQuery;
    const finalSortBy = updates.sortBy ?? sortBy;
    const finalSortDirection = updates.sortDirection ?? sortDirection;
    const finalStyles = updates.styles ?? selectedStyles;
    const finalAbvMin = updates.abvMin ?? abvMin;
    const finalAbvMax = updates.abvMax ?? abvMax;

    // Set search param
    if (finalQuery) {
      params.set("q", finalQuery);
    } else {
      params.delete("q");
    }

    // Set sort params
    params.set("sort", finalSortBy);
    params.set("direction", finalSortDirection);

    // Set filter params
    if (finalStyles.length > 0) {
      params.set("styles", finalStyles.join(","));
    } else {
      params.delete("styles");
    }

    if (finalAbvMin) {
      params.set("abvMin", finalAbvMin);
    } else {
      params.delete("abvMin");
    }

    if (finalAbvMax) {
      params.set("abvMax", finalAbvMax);
    } else {
      params.delete("abvMax");
    }

    // Reset to page 1 when filters change
    params.set("page", "1");

    router.push(`${pathname}?${params.toString()}`);
  };

  const toggleStyle = (style: string) => {
    const newStyles = selectedStyles.includes(style)
      ? selectedStyles.filter((s) => s !== style)
      : [...selectedStyles, style];

    setSelectedStyles(newStyles);
    applyFiltersToUrl({ styles: newStyles });
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    applyFiltersToUrl({ q: searchQuery });
  };

  return (
    <>
      {/* Toggle Button */}
      <Button
        onClick={onToggle}
        variant="outline"
        className={`fixed top-1/2 -translate-y-1/2 z-20 transition-all duration-300 h-24 px-2 rounded-r-lg rounded-l-none flex flex-col items-center justify-center gap-1 ${
          isOpen ? "left-64" : "left-0"
        }`}
        aria-label={isOpen ? "Hide filters" : "Show filters"}
      >
        {isOpen ? (
          <>
            <ChevronLeft className="h-4 w-4" />
            <span className="text-xs [writing-mode:vertical-lr]">Hide</span>
          </>
        ) : (
          <>
            <SlidersHorizontal className="h-4 w-4" />
            <span className="text-xs [writing-mode:vertical-lr]">Filters</span>
          </>
        )}
      </Button>

      {/* Sidebar */}
      <div
        className={`fixed left-0 top-16 h-[calc(100vh-4rem)] w-64 border-r bg-card p-6 space-y-6 transition-transform duration-300 overflow-y-auto z-10 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div>
          <h2 className="text-lg font-semibold mb-4">Search & Filter</h2>
        </div>

        {/* Search Section */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium">Search Beers</h3>
          <form onSubmit={handleSearch} className="flex gap-2">
            <Input
              type="text"
              placeholder="Search by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 text-sm"
            />
            <Button type="submit" size="sm" variant="secondary">
              <Search className="h-4 w-4" />
            </Button>
          </form>
        </div>

        {/* Sort Section */}
        <div className="space-y-3 border-t pt-4">
          <h3 className="text-sm font-medium">Sort By</h3>
          <div className="space-y-2">
            {[
              { value: "popularity", label: "Popularity" },
              { value: "name", label: "Name" },
              { value: "style", label: "Style" },
              { value: "abv", label: "ABV" },
            ].map((option) => (
              <div key={option.value} className="flex items-center space-x-2">
                <input
                  type="radio"
                  id={`brewery-sort-${option.value}`}
                  name="brewery-sort"
                  value={option.value}
                  checked={sortBy === option.value}
                  onChange={(e) => {
                    const newSort = e.target.value as BrewerySortOption;
                    setSortBy(newSort);

                    // Default to descending for popularity, ascending for others
                    const newDirection = newSort === 'popularity' ? 'desc' : 'asc';
                    setSortDirection(newDirection);

                    applyFiltersToUrl({ sortBy: newSort, sortDirection: newDirection });
                  }}
                  className="h-4 w-4"
                />
                <Label htmlFor={`brewery-sort-${option.value}`} className="text-sm cursor-pointer">
                  {option.label}
                </Label>
              </div>
            ))}
          </div>

          <div className="space-y-2 pt-2">
            <div className="flex items-center space-x-2">
              <input
                type="radio"
                id="brewery-sort-asc"
                name="brewery-direction"
                value="asc"
                checked={sortDirection === "asc"}
                onChange={(e) => {
                  const newDirection = e.target.value as SortDirection;
                  setSortDirection(newDirection);
                  applyFiltersToUrl({ sortDirection: newDirection });
                }}
                className="h-4 w-4"
              />
              <Label htmlFor="brewery-sort-asc" className="text-sm cursor-pointer">
                Ascending
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="radio"
                id="brewery-sort-desc"
                name="brewery-direction"
                value="desc"
                checked={sortDirection === "desc"}
                onChange={(e) => {
                  const newDirection = e.target.value as SortDirection;
                  setSortDirection(newDirection);
                  applyFiltersToUrl({ sortDirection: newDirection });
                }}
                className="h-4 w-4"
              />
              <Label htmlFor="brewery-sort-desc" className="text-sm cursor-pointer">
                Descending
              </Label>
            </div>
          </div>
        </div>

        <div className="border-t pt-6 space-y-3">
          <h3 className="text-sm font-medium">Filters</h3>

          {/* ABV Range */}
          <div className="space-y-2">
            <Label className="text-sm">ABV Range</Label>
            <div className="flex items-center space-x-2">
              <Input
                type="number"
                placeholder="Min"
                value={abvMin}
                onChange={(e) => setAbvMin(e.target.value)}
                onBlur={() => applyFiltersToUrl({ abvMin })}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    applyFiltersToUrl({ abvMin });
                  }
                }}
                className="h-8 text-sm"
                min="0"
                max="100"
                step="0.1"
              />
              <span className="text-sm text-muted-foreground">to</span>
              <Input
                type="number"
                placeholder="Max"
                value={abvMax}
                onChange={(e) => setAbvMax(e.target.value)}
                onBlur={() => applyFiltersToUrl({ abvMax })}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    applyFiltersToUrl({ abvMax });
                  }
                }}
                className="h-8 text-sm"
                min="0"
                max="100"
                step="0.1"
              />
            </div>
          </div>

          {/* Style Filter */}
          {availableStyles.length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm">Style ({availableStyles.length})</Label>
              <div className="max-h-40 overflow-y-auto space-y-2 text-sm">
                {availableStyles.map((style) => (
                  <div key={style} className="flex items-center space-x-2">
                    <Checkbox
                      id={`brewery-style-${style}`}
                      checked={selectedStyles.includes(style)}
                      onCheckedChange={() => toggleStyle(style)}
                    />
                    <label
                      htmlFor={`brewery-style-${style}`}
                      className="text-sm cursor-pointer leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {style}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="pt-4 border-t">
          <Button
            onClick={resetFilters}
            variant="outline"
            className="w-full"
            size="sm"
          >
            Reset All
          </Button>
        </div>
      </div>
    </>
  );
}
