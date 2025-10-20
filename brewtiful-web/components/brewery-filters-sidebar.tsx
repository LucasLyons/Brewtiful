"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronLeft, SlidersHorizontal } from "lucide-react";

export type BrewerySortOption = "name" | "country" | "city";
export type SortDirection = "asc" | "desc";

interface BreweryFiltersSidebarProps {
  availableCountries?: string[];
  availableCities?: string[];
  availableProvinceOrStates?: string[];
  isOpen: boolean;
  onToggle: () => void;
}

export function BreweryFiltersSidebar({
  availableCountries = [],
  availableCities = [],
  availableProvinceOrStates = [],
  isOpen,
  onToggle,
}: BreweryFiltersSidebarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Sort state
  const [sortBy, setSortBy] = useState<BrewerySortOption>("name");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  // Filter state
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const [selectedCities, setSelectedCities] = useState<string[]>([]);
  const [selectedProvinceOrStates, setSelectedProvinceOrStates] = useState<string[]>([]);

  // Initialize from URL params
  useEffect(() => {
    const sort = searchParams.get("sort") as BrewerySortOption | null;
    const direction = searchParams.get("direction") as SortDirection | null;
    const countries = searchParams.get("countries");
    const cities = searchParams.get("cities");
    const provinceOrStates = searchParams.get("provinceOrStates");

    if (sort) setSortBy(sort);
    if (direction) setSortDirection(direction);
    if (countries) setSelectedCountries(countries.split(","));
    if (cities) setSelectedCities(cities.split(","));
    if (provinceOrStates) setSelectedProvinceOrStates(provinceOrStates.split(","));
  }, [searchParams]);

  const resetFilters = () => {
    // Clear filter state but keep sort settings
    setSelectedCountries([]);
    setSelectedCities([]);
    setSelectedProvinceOrStates([]);

    const params = new URLSearchParams(searchParams.toString());
    // Keep sort and direction, only delete filter params
    params.delete("countries");
    params.delete("cities");
    params.delete("provinceOrStates");
    params.set("page", "1");

    router.push(`/breweries?${params.toString()}`);
  };

  const applyFiltersToUrl = (updates: {
    sortBy?: BrewerySortOption;
    sortDirection?: SortDirection;
    countries?: string[];
    cities?: string[];
    provinceOrStates?: string[];
  }) => {
    const params = new URLSearchParams(searchParams.toString());

    // Apply updates
    const finalSortBy = updates.sortBy ?? sortBy;
    const finalSortDirection = updates.sortDirection ?? sortDirection;
    const finalCountries = updates.countries ?? selectedCountries;
    const finalCities = updates.cities ?? selectedCities;
    const finalProvinceOrStates = updates.provinceOrStates ?? selectedProvinceOrStates;

    // Set sort params
    params.set("sort", finalSortBy);
    params.set("direction", finalSortDirection);

    // Set filter params
    if (finalCountries.length > 0) {
      params.set("countries", finalCountries.join(","));
    } else {
      params.delete("countries");
    }

    if (finalCities.length > 0) {
      params.set("cities", finalCities.join(","));
    } else {
      params.delete("cities");
    }

    if (finalProvinceOrStates.length > 0) {
      params.set("provinceOrStates", finalProvinceOrStates.join(","));
    } else {
      params.delete("provinceOrStates");
    }

    // Reset to page 1 when filters change
    params.set("page", "1");

    router.push(`/breweries?${params.toString()}`);
  };

  const toggleCountry = (country: string) => {
    const newCountries = selectedCountries.includes(country)
      ? selectedCountries.filter((c) => c !== country)
      : [...selectedCountries, country];

    setSelectedCountries(newCountries);
    applyFiltersToUrl({ countries: newCountries });
  };

  const toggleCity = (city: string) => {
    const newCities = selectedCities.includes(city)
      ? selectedCities.filter((c) => c !== city)
      : [...selectedCities, city];

    setSelectedCities(newCities);
    applyFiltersToUrl({ cities: newCities });
  };

  const toggleProvinceOrState = (provinceOrState: string) => {
    const newProvinceOrStates = selectedProvinceOrStates.includes(provinceOrState)
      ? selectedProvinceOrStates.filter((p) => p !== provinceOrState)
      : [...selectedProvinceOrStates, provinceOrState];

    setSelectedProvinceOrStates(newProvinceOrStates);
    applyFiltersToUrl({ provinceOrStates: newProvinceOrStates });
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
          <h2 className="text-lg font-semibold mb-4">Sort & Filter</h2>
        </div>

      {/* Sort Section */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium">Sort By</h3>
        <div className="space-y-2">
          {[
            { value: "name", label: "Name" },
            { value: "country", label: "Country" },
            { value: "city", label: "City" },
          ].map((option) => (
            <div key={option.value} className="flex items-center space-x-2">
              <input
                type="radio"
                id={`sort-${option.value}`}
                name="sort"
                value={option.value}
                checked={sortBy === option.value}
                onChange={(e) => {
                  const newSort = e.target.value as BrewerySortOption;
                  setSortBy(newSort);
                  setSortDirection('asc');
                  applyFiltersToUrl({ sortBy: newSort, sortDirection: 'asc' });
                }}
                className="h-4 w-4"
              />
              <Label htmlFor={`sort-${option.value}`} className="text-sm cursor-pointer">
                {option.label}
              </Label>
            </div>
          ))}
        </div>

        <div className="space-y-2 pt-2">
          <div className="flex items-center space-x-2">
            <input
              type="radio"
              id="sort-asc"
              name="direction"
              value="asc"
              checked={sortDirection === "asc"}
              onChange={(e) => {
                const newDirection = e.target.value as SortDirection;
                setSortDirection(newDirection);
                applyFiltersToUrl({ sortDirection: newDirection });
              }}
              className="h-4 w-4"
            />
            <Label htmlFor="sort-asc" className="text-sm cursor-pointer">
              Ascending
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="radio"
              id="sort-desc"
              name="direction"
              value="desc"
              checked={sortDirection === "desc"}
              onChange={(e) => {
                const newDirection = e.target.value as SortDirection;
                setSortDirection(newDirection);
                applyFiltersToUrl({ sortDirection: newDirection });
              }}
              className="h-4 w-4"
            />
            <Label htmlFor="sort-desc" className="text-sm cursor-pointer">
              Descending
            </Label>
          </div>
        </div>
      </div>

      <div className="border-t pt-6 space-y-3">
        <h3 className="text-sm font-medium">Filters</h3>

        {/* Country Filter */}
        {availableCountries.length > 0 && (
          <div className="space-y-2">
            <Label className="text-sm">Country ({availableCountries.length})</Label>
            <div className="max-h-40 overflow-y-auto space-y-2 text-sm">
              {availableCountries.map((country) => (
                <div key={country} className="flex items-center space-x-2">
                  <Checkbox
                    id={`country-${country}`}
                    checked={selectedCountries.includes(country)}
                    onCheckedChange={() => toggleCountry(country)}
                  />
                  <label
                    htmlFor={`country-${country}`}
                    className="text-sm cursor-pointer leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {country}
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

        {/* Province/State Filter */}
        {availableProvinceOrStates.length > 0 && (
          <div className="space-y-2">
            <Label className="text-sm">Province/State ({availableProvinceOrStates.length})</Label>
            <div className="max-h-40 overflow-y-auto space-y-2 text-sm">
              {availableProvinceOrStates.map((provinceOrState) => (
                <div key={provinceOrState} className="flex items-center space-x-2">
                  <Checkbox
                    id={`provinceOrState-${provinceOrState}`}
                    checked={selectedProvinceOrStates.includes(provinceOrState)}
                    onCheckedChange={() => toggleProvinceOrState(provinceOrState)}
                  />
                  <label
                    htmlFor={`provinceOrState-${provinceOrState}`}
                    className="text-sm cursor-pointer leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {provinceOrState}
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
