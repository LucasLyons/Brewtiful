"use client";

import { useRef, useState, useEffect } from "react";
import Link from "next/link";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { MapPin, Building2 } from "lucide-react";
import { ClickableFilter } from "@/components/shared/clickable-filter";
import { SaveBreweryButton } from "@/components/shared/save-brewery-button";

interface BreweryListItemProps {
  breweryId: string;
  name: string;
  country?: string;
  provinceOrState?: string;
  city?: string;
  isSaved?: boolean;
  onSaved?: (breweryId: number) => void;
  onUnsaved?: (breweryId: number) => void;
}

function TruncatedText({
  children,
  className,
  as: Component = "span"
}: {
  children: string;
  className?: string;
  as?: "div" | "span" | "p";
}) {
  const ref = useRef<HTMLDivElement & HTMLSpanElement & HTMLParagraphElement>(null);
  const [isTruncated, setIsTruncated] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (element) {
      setIsTruncated(element.scrollHeight > element.clientHeight || element.scrollWidth > element.clientWidth);
    }
  }, [children]);

  if (isTruncated) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Component ref={ref} className={`${className} cursor-help`}>
            {children}
          </Component>
        </TooltipTrigger>
        <TooltipContent>
          <p className="max-w-xs">{children}</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  return <Component ref={ref} className={className}>{children}</Component>;
}

function TruncatedClickableFilter({
  value,
  filterType,
  basePath,
  className
}: {
  value: string;
  filterType: "city" | "country" | "style";
  basePath: "/beers" | "/breweries";
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [isTruncated, setIsTruncated] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (element) {
      setIsTruncated(element.scrollHeight > element.clientHeight || element.scrollWidth > element.clientWidth);
    }
  }, [value]);

  const filter = (
    <div ref={ref} className={className}>
      <ClickableFilter
        value={value}
        filterType={filterType}
        basePath={basePath}
      />
    </div>
  );

  if (isTruncated) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="cursor-help min-w-0">
            {filter}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p className="max-w-xs">{value}</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  return filter;
}

export function BreweryListItem({
  breweryId,
  name,
  country,
  provinceOrState,
  city,
  isSaved,
  onSaved,
  onUnsaved
}: BreweryListItemProps) {
  return (
    <TooltipProvider delayDuration={1000}>
      {/* Desktop view (grid) */}
      <div className="hidden lg:grid grid-cols-13 gap-4 px-4 py-3 hover:bg-muted/50 transition-colors border-b last:border-b-0">
        {/* Name */}
        <div className="col-span-3 flex items-center min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <Building2 className="h-4 w-4 shrink-0 text-muted-foreground" />
            <Link
              href={`/breweries/${breweryId}`}
              className="font-medium line-clamp-2 hover:text-primary hover:underline transition-colors"
            >
              {name}
            </Link>
          </div>
        </div>

        {/* Country */}
        <div className="col-span-3 flex items-center gap-1 text-sm text-muted-foreground min-w-0">
          {country ? (
            <>
              <MapPin className="h-4 w-4 shrink-0" />
              <TruncatedClickableFilter
                value={country}
                filterType="country"
                basePath="/breweries"
                className="line-clamp-1"
              />
            </>
          ) : (
            <span>-</span>
          )}
        </div>

        {/* Province/State */}
        <div className="col-span-3 flex items-center text-sm text-muted-foreground min-w-0">
          {provinceOrState ? (
            <TruncatedText className="line-clamp-1">{provinceOrState}</TruncatedText>
          ) : (
            <span>-</span>
          )}
        </div>

        {/* City */}
        <div className="col-span-3 flex items-center text-sm text-muted-foreground min-w-0">
          {city ? (
            <TruncatedClickableFilter
              value={city}
              filterType="city"
              basePath="/breweries"
              className="line-clamp-1"
            />
          ) : (
            <span>-</span>
          )}
        </div>

        {/* Save */}
        <div className="col-span-1 flex items-center justify-center">
          <SaveBreweryButton
            breweryId={parseInt(breweryId)}
            initialIsSaved={isSaved}
            onSaved={onSaved}
            onUnsaved={onUnsaved}
          />
        </div>
      </div>

      {/* Mobile view (stacked card) */}
      <div className="lg:hidden p-4 hover:bg-muted/50 transition-colors border-b last:border-b-0">
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex items-start gap-2 min-w-0 flex-1">
            <Building2 className="h-5 w-5 shrink-0 text-muted-foreground mt-0.5" />
            <Link
              href={`/breweries/${breweryId}`}
              className="font-medium text-base hover:text-primary hover:underline transition-colors line-clamp-2"
            >
              {name}
            </Link>
          </div>
          <SaveBreweryButton
            breweryId={parseInt(breweryId)}
            initialIsSaved={isSaved}
            onSaved={onSaved}
            onUnsaved={onUnsaved}
          />
        </div>

        <div className="space-y-1 text-sm text-muted-foreground pl-7">
          {country && (
            <div className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">
                {city && <TruncatedClickableFilter value={city} filterType="city" basePath="/breweries" className="line-clamp-1" />}
                {city && provinceOrState && <span>, </span>}
                {provinceOrState && <span>{provinceOrState}</span>}
                {(city || provinceOrState) && <span>, </span>}
                <TruncatedClickableFilter value={country} filterType="country" basePath="/breweries" className="line-clamp-1" />
              </span>
            </div>
          )}
          {!country && (city || provinceOrState) && (
            <div className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">
                {city && <TruncatedClickableFilter value={city} filterType="city" basePath="/breweries" className="line-clamp-1" />}
                {city && provinceOrState && <span>, </span>}
                {provinceOrState && <span>{provinceOrState}</span>}
              </span>
            </div>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}
