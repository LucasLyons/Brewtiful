"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";

export function BeerSearch() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [query, setQuery] = useState(searchParams.get("q") || "");

  const handleSearch = () => {
    const params = new URLSearchParams();

    if (query.trim()) {
      params.set("q", query.trim());
    }

    // Reset to page 1 when searching
    params.set("page", "1");

    router.push(`/beers?${params.toString()}`);
  };

  const handleClear = () => {
    setQuery("");
    const params = new URLSearchParams();
    params.set("page", "1");
    router.push(`/beers?${params.toString()}`);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const hasActiveFilter = query.trim();

  return (
    <div className="w-full">
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
        <div className="flex-1">
          <Input
            type="text"
            placeholder="Search by beer name or brewery..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            className="w-full h-10"
          />
        </div>
        <div className="flex gap-2">
          <Button onClick={handleSearch} className="flex-1 sm:flex-initial items-center gap-2 h-10">
            <Search className="h-4 w-4" />
            <span className="sm:inline">Search</span>
          </Button>
          {hasActiveFilter && (
            <Button
              onClick={handleClear}
              variant="outline"
              className="flex-1 sm:flex-initial items-center gap-2 h-10"
            >
              <X className="h-4 w-4" />
              <span className="sm:inline">Clear</span>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
