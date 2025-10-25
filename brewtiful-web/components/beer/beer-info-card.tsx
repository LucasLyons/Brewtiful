"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Beer, MapPin, Building2, CheckCircle2, XCircle, HelpCircle } from "lucide-react";
import { ClickableFilter } from "@/components/shared/clickable-filter";

interface Brewery {
  brewery_id: number;
  name: string;
  country?: string;
  province_or_state?: string;
  city?: string;
  description?: string;
}

interface BeerData {
  beer_id: number;
  name: string;
  style: string;
  user_review_count: number;
  abv?: number;
  description?: string;
  active: 'Active' | 'Inactive' | 'Unknown';
  brewery: Brewery | Brewery[];
}

interface BeerInfoCardProps {
  beer: BeerData;
}

export function BeerInfoCard({ beer }: BeerInfoCardProps) {
  // Handle brewery being an array (from Supabase join)
  const brewery = Array.isArray(beer.brewery) ? beer.brewery[0] : beer.brewery;

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <CardTitle className="flex items-center gap-2 text-3xl flex-1">
            <Beer className="h-8 w-8" />
            {beer.name}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Description */}
        {beer.description && (
          <div className="text-muted-foreground">
            {beer.description}
          </div>
        )}
        {!beer.description &&(
          <div className="text-muted-foreground">
            No description (yet)!
          </div>
        )}

        {/* Key Facts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4">
          {/* Brewery */}
          {brewery && (
            <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
              <Building2 className="h-5 w-5 mt-0.5 text-primary shrink-0" />
              <div className="space-y-1">
                <div className="text-sm font-medium">Brewery</div>
                <Link
                  href={`/breweries/${brewery.brewery_id}`}
                  className="text-sm text-primary hover:underline break-words"
                >
                  {brewery.name}
                </Link>
              </div>
            </div>
          )}

          {/* Location */}
          {brewery && (brewery.city || brewery.province_or_state || brewery.country) && (
            <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
              <MapPin className="h-5 w-5 mt-0.5 text-primary shrink-0" />
              <div className="space-y-1">
                <div className="text-sm font-medium">Location</div>
                <div className="text-sm text-muted-foreground flex gap-1 flex-wrap">
                  {brewery.city && (
                    <>
                      <ClickableFilter
                        value={brewery.city}
                        filterType="city"
                        basePath="/beers"
                      />
                      {(brewery.province_or_state || brewery.country) && <span>,</span>}
                    </>
                  )}
                  {brewery.province_or_state && (
                    <>
                      <span>{brewery.province_or_state}</span>
                      {brewery.country && <span>,</span>}
                    </>
                  )}
                  {brewery.country && (
                    <ClickableFilter
                      value={brewery.country}
                      filterType="country"
                      basePath="/beers"
                    />
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ABV */}
          {beer.abv !== null && beer.user_review_count !== undefined && (
            <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
              <Beer className="h-5 w-5 mt-0.5 text-primary shrink-0" />
              <div className="space-y-1">
                <div className="text-sm font-medium">ABV</div>
                <div className="text-sm text-muted-foreground">
                  {beer.abv}%
                </div>
              </div>
            </div>
          )}

          {/* Style */}
          <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
            <Beer className="h-5 w-5 mt-0.5 text-primary shrink-0" />
            <div className="space-y-1">
              <div className="text-sm font-medium">Style</div>
              <div className="text-sm text-muted-foreground">
                <ClickableFilter
                  value={beer.style}
                  filterType="style"
                  basePath="/beers"
                />
              </div>
            </div>
          </div>

          {/* Review Count */}
          {beer.user_review_count !== null && beer.user_review_count !== undefined && (
            <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
              <Beer className="h-5 w-5 mt-0.5 text-primary shrink-0" />
              <div className="space-y-1">
                <div className="text-sm font-medium">Reviews</div>
                <div className="text-sm text-muted-foreground">
                  {beer.user_review_count.toLocaleString()}
                </div>
              </div>
            </div>
          )}

          {/* Active Status */}
          {beer.active && (
            <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
              {beer.active === 'Active' ? (
                <CheckCircle2 className="h-5 w-5 mt-0.5 text-green-600 dark:text-green-500 shrink-0" />
              ) : beer.active === 'Inactive' ? (
                <XCircle className="h-5 w-5 mt-0.5 text-red-600 dark:text-red-500 shrink-0" />
              ) : (
                <HelpCircle className="h-5 w-5 mt-0.5 text-gray-500 dark:text-gray-400 shrink-0" />
              )}
              <div className="space-y-1">
                <div className="text-sm font-medium">Status</div>
                <div className="text-sm text-muted-foreground">
                  {beer.active}
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
