"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Building2, Globe } from "lucide-react";
import { ClickableFilter } from "@/components/clickable-filter";

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
}

export function BreweryInfoCard({ brewery }: BreweryInfoCardProps) {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-3xl">
          <Building2 className="h-8 w-8" />
          {brewery.name}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Description */}
        {brewery.description && (
          <div className="text-muted-foreground">
            {brewery.description}
          </div>
        )}

        {/* Key Facts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4">
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
