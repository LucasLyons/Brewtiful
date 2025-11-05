"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronLeft, SlidersHorizontal } from "lucide-react";

interface RecommendationsFiltersSidebarProps {
  availableBreweries?: string[];
  availableStyles?: string[];
  availableLocations?: string[];
  availableCities?: string[];
  isOpen: boolean;
  onToggle: () => void;
}

export function RecommendationsFiltersSidebar({
  availableBreweries = [],
  availableStyles = [],
  availableLocations = [],
  availableCities = [],
  isOpen,
  onToggle,
}: RecommendationsFiltersSidebarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Filter state
  const [selectedBreweries, setSelectedBreweries] = useState<string[]>([]);
  const [selectedStyles, setSelectedStyles] = useState<string[]>([]);
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [selectedCities, setSelectedCities] = useState<string[]>([]);
  const [abvMin, setAbvMin] = useState<string>("");
  const [abvMax, setAbvMax] = useState<string>("");
  const [includeInactive, setIncludeInactive] = useState<boolean>(false);
  const [includeUnknown, setIncludeUnknown] = useState<boolean>(true);

  // Initialize from URL params
  useEffect(() => {
    const breweries = searchParams.get("breweries");
    const styles = searchParams.get("styles");
    const locations = searchParams.get("locations");
    const cities = searchParams.get("cities");
    const minAbv = searchParams.get("abvMin");
    const maxAbv = searchParams.get("abvMax");
    const inactive = searchParams.get("includeInactive");
    const unknown = searchParams.get("includeUnknown");

    if (breweries) setSelectedBreweries(breweries.split(","));
    if (styles) setSelectedStyles(styles.split(","));
    if (locations) setSelectedLocations(locations.split(","));
    if (cities) setSelectedCities(cities.split(","));
    if (minAbv) setAbvMin(minAbv);
    if (maxAbv) setAbvMax(maxAbv);
    setIncludeInactive(inactive === 'true');
    // Unknown is included by default (excluded only when explicitly set to 'false')
    setIncludeUnknown(unknown !== 'false');
  }, [searchParams]);

  const resetFilters = () => {
    // Clear all filter state
    setSelectedBreweries([]);
    setSelectedStyles([]);
    setSelectedLocations([]);
    setSelectedCities([]);
    setAbvMin("");
    setAbvMax("");
    setIncludeInactive(false);
    setIncludeUnknown(true);

    const params = new URLSearchParams(searchParams.toString());
    // Delete all filter params
    params.delete("breweries");
    params.delete("styles");
    params.delete("locations");
    params.delete("cities");
    params.delete("abvMin");
    params.delete("abvMax");
    params.delete("includeInactive");
    params.delete("includeUnknown");
    params.set("page", "1");

    router.push(`/recommendations?${params.toString()}`);
  };

  const applyFiltersToUrl = (updates: {
    breweries?: string[];
    styles?: string[];
    locations?: string[];
    cities?: string[];
    abvMin?: string;
    abvMax?: string;
    includeInactive?: boolean;
    includeUnknown?: boolean;
  }) => {
    const params = new URLSearchParams(searchParams.toString());

    // Apply updates
    const finalBreweries = updates.breweries ?? selectedBreweries;
    const finalStyles = updates.styles ?? selectedStyles;
    const finalLocations = updates.locations ?? selectedLocations;
    const finalCities = updates.cities ?? selectedCities;
    const finalAbvMin = updates.abvMin ?? abvMin;
    const finalAbvMax = updates.abvMax ?? abvMax;
    const finalIncludeInactive = updates.includeInactive ?? includeInactive;
    const finalIncludeUnknown = updates.includeUnknown ?? includeUnknown;

    // Set filter params
    if (finalBreweries.length > 0) {
      params.set("breweries", finalBreweries.join(","));
    } else {
      params.delete("breweries");
    }

    if (finalStyles.length > 0) {
      params.set("styles", finalStyles.join(","));
    } else {
      params.delete("styles");
    }

    if (finalLocations.length > 0) {
      params.set("locations", finalLocations.join(","));
    } else {
      params.delete("locations");
    }

    if (finalCities.length > 0) {
      params.set("cities", finalCities.join(","));
    } else {
      params.delete("cities");
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

    if (finalIncludeInactive) {
      params.set("includeInactive", "true");
    } else {
      params.delete("includeInactive");
    }

    // Unknown is included by default, set param to false when explicitly excluded
    if (!finalIncludeUnknown) {
      params.set("includeUnknown", "false");
    } else {
      params.delete("includeUnknown");
    }

    // Reset to page 1 when filters change
    params.set("page", "1");

    router.push(`/recommendations?${params.toString()}`);
  };

  const toggleBrewery = (brewery: string) => {
    const newBreweries = selectedBreweries.includes(brewery)
      ? selectedBreweries.filter((b) => b !== brewery)
      : [...selectedBreweries, brewery];

    setSelectedBreweries(newBreweries);
    applyFiltersToUrl({ breweries: newBreweries });
  };

  const toggleStyle = (style: string) => {
    const newStyles = selectedStyles.includes(style)
      ? selectedStyles.filter((s) => s !== style)
      : [...selectedStyles, style];

    setSelectedStyles(newStyles);
    applyFiltersToUrl({ styles: newStyles });
  };

  const toggleLocation = (location: string) => {
    const newLocations = selectedLocations.includes(location)
      ? selectedLocations.filter((l) => l !== location)
      : [...selectedLocations, location];

    setSelectedLocations(newLocations);
    applyFiltersToUrl({ locations: newLocations });
  };

  const toggleCity = (city: string) => {
    const newCities = selectedCities.includes(city)
      ? selectedCities.filter((c) => c !== city)
      : [...selectedCities, city];

    setSelectedCities(newCities);
    applyFiltersToUrl({ cities: newCities });
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
          <h2 className="text-lg font-semibold mb-4">Filters</h2>
          <p className="text-xs text-muted-foreground">
            Filter your personalized recommendations
          </p>
        </div>

      <div className="space-y-3">
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

        {/* Brewery Filter */}
        {availableBreweries.length > 0 && (
          <div className="space-y-2">
            <Label className="text-sm">Brewery ({availableBreweries.length})</Label>
            <div className="max-h-40 overflow-y-auto space-y-2 text-sm">
              {availableBreweries.map((brewery) => (
                <div key={brewery} className="flex items-center space-x-2">
                  <Checkbox
                    id={`brewery-${brewery}`}
                    checked={selectedBreweries.includes(brewery)}
                    onCheckedChange={() => toggleBrewery(brewery)}
                  />
                  <label
                    htmlFor={`brewery-${brewery}`}
                    className="text-sm cursor-pointer leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {brewery}
                  </label>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Style Filter */}
        {availableStyles.length > 0 && (
          <div className="space-y-2">
            <Label className="text-sm">Style ({availableStyles.length})</Label>
            <div className="max-h-40 overflow-y-auto space-y-2 text-sm">
              {availableStyles.map((style) => (
                <div key={style} className="flex items-center space-x-2">
                  <Checkbox
                    id={`style-${style}`}
                    checked={selectedStyles.includes(style)}
                    onCheckedChange={() => toggleStyle(style)}
                  />
                  <label
                    htmlFor={`style-${style}`}
                    className="text-sm cursor-pointer leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {style}
                  </label>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Country Filter */}
        {availableLocations.length > 0 && (
          <div className="space-y-2">
            <Label className="text-sm">Country ({availableLocations.length})</Label>
            <div className="max-h-40 overflow-y-auto space-y-2 text-sm">
              {availableLocations.map((location) => (
                <div key={location} className="flex items-center space-x-2">
                  <Checkbox
                    id={`location-${location}`}
                    checked={selectedLocations.includes(location)}
                    onCheckedChange={() => toggleLocation(location)}
                  />
                  <label
                    htmlFor={`location-${location}`}
                    className="text-sm cursor-pointer leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {location}
                  </label>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* City Filter */}
        {availableCities.length > 0 && (
          <div className="space-y-2">
            <Label className="text-sm">City ({availableCities.length})</Label>
            <div className="max-h-40 overflow-y-auto space-y-2 text-sm">
              {availableCities.map((city) => (
                <div key={city} className="flex items-center space-x-2">
                  <Checkbox
                    id={`city-${city}`}
                    checked={selectedCities.includes(city)}
                    onCheckedChange={() => toggleCity(city)}
                  />
                  <label
                    htmlFor={`city-${city}`}
                    className="text-sm cursor-pointer leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {city}
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
