"use client";

import Link from "next/link";

interface ClickableFilterProps {
  value: string;
  filterType: "city" | "country" | "style";
  basePath: "/beers" | "/breweries";
  className?: string;
  onClick?: (e: React.MouseEvent) => void;
}

export function ClickableFilter({
  value,
  filterType,
  basePath,
  className = "",
  onClick
}: ClickableFilterProps) {
  const searchParams = new URLSearchParams();

  // Map filter types to the correct URL parameter names
  // Beers page expects: cities, locations (for country), styles
  // Breweries page expects: cities, countries
  let paramName: string;
  if (basePath === "/beers") {
    if (filterType === "city") {
      paramName = "cities";
    } else if (filterType === "country") {
      paramName = "locations";
    } else {
      paramName = "styles";
    }
  } else {
    // breweries
    if (filterType === "city") {
      paramName = "cities";
    } else {
      paramName = "countries";
    }
  }

  searchParams.set(paramName, value);

  return (
    <Link
      href={`${basePath}?${searchParams.toString()}`}
      className={`hover:text-primary hover:underline transition-colors ${className}`}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.(e);
      }}
    >
      {value}
    </Link>
  );
}
