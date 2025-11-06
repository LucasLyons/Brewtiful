"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Building2, Globe } from "lucide-react";
import { ClickableFilter } from "@/components/shared/clickable-filter";
import { SaveBreweryButton } from "@/components/shared/save-brewery-button";

interface Brewery {
  brewery_id: string;
  name: string;
  country?: string;
  province_or_state?: string;
  city?: string;
  address?: string;
  website_url?: string;
  description?: string;
}

interface BreweryInfoCardProps {
  brewery: Brewery;
  isSaved?: boolean;
}

export function BreweryInfoCard({ brewery, isSaved }: BreweryInfoCardProps) {
  return (
    <Card className="w-full">
      <CardHeader className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          <CardTitle className="flex items-center gap-2 text-xl sm:text-2xl md:text-3xl flex-1 leading-tight">
            <Building2 className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 shrink-0" />
            <span className="break-words">{brewery.name}</span>
          </CardTitle>
          <SaveBreweryButton breweryId={parseInt(brewery.brewery_id)} initialIsSaved={isSaved} />
        </div>
      </CardHeader>
      <CardContent className="space-y-4 p-4 sm:p-6">
        {/* Description */}
        {brewery.description && (
          <div className="text-sm sm:text-base text-muted-foreground">
            {brewery.description}
          </div>
        )}

        {/* Key Facts Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 pt-4">
          {/* Location */}
          {(brewery.country || brewery.province_or_state || brewery.city) && (
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
                        basePath="/breweries"
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
                      basePath="/breweries"
                    />
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Address */}
          {brewery.address && (
            <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
              <Building2 className="h-5 w-5 mt-0.5 text-primary shrink-0" />
              <div className="space-y-1">
                <div className="text-sm font-medium">Address</div>
                <div className="text-sm text-muted-foreground">
                  {brewery.address}
                </div>
              </div>
            </div>
          )}

          {/* Website */}
          {brewery.website_url && (
            <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
              <Globe className="h-5 w-5 mt-0.5 text-primary shrink-0" />
              <div className="space-y-1">
                <div className="text-sm font-medium">Website</div>
                <a
                  href={brewery.website_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline break-all"
                >
                  {brewery.website_url.replace(/^https?:\/\//, '')}
                </a>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
