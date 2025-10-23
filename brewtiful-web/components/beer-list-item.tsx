"use client";

import { useRef, useState, useEffect } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Beer, MapPin } from "lucide-react";

interface BeerListItemProps {
  name: string;
  brewery: string;
  breweryId: number;
  style: string;
  abv?: number;
  country?: string;
  city?: string;
  description?: string;
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

export function BeerListItem({
  name,
  brewery,
  breweryId,
  style,
  abv,
  country,
  city,
  description
}: BeerListItemProps) {
  return (
    <TooltipProvider>
      <div className="grid grid-cols-12 gap-4 px-4 py-3 hover:bg-muted/50 transition-colors border-b last:border-b-0">
        {/* Name */}
        <div className="col-span-2 flex items-center min-w-0">
          <span className="font-medium line-clamp-2">{name}</span>
        </div>

        {/* Brewery */}
        <div className="col-span-2 flex items-center gap-1 text-sm text-muted-foreground min-w-0">
          <Beer className="h-4 w-4 shrink-0" />
          <Link
            href={`/breweries/${breweryId}`}
            className="line-clamp-1 hover:text-primary hover:underline transition-colors"
          >
            <TruncatedText className="line-clamp-1">{brewery}</TruncatedText>
          </Link>
        </div>

        {/* Style */}
        <div className="col-span-2 flex items-center min-w-0">
          <Badge variant="outline" className="line-clamp-1 max-w-full">{style}</Badge>
        </div>

        {/* ABV */}
        <div className="col-span-1 flex items-center justify-center">
          {abv ? (
            <Badge variant="secondary">{abv}</Badge>
          ) : (
            <span className="text-sm text-muted-foreground">-</span>
          )}
        </div>

        {/* Country */}
        <div className="col-span-1 flex items-center gap-1 text-sm text-muted-foreground min-w-0">
          {country ? (
            <>
              <MapPin className="h-4 w-4 shrink-0" />
              <TruncatedText className="line-clamp-1">{country}</TruncatedText>
            </>
          ) : (
            <span>-</span>
          )}
        </div>

        {/* City */}
        <div className="col-span-1 flex items-center text-sm text-muted-foreground min-w-0">
          {city ? (
            <TruncatedText className="line-clamp-1">{city}</TruncatedText>
          ) : (
            <span>-</span>
          )}
        </div>

        {/* Description */}
        <div className="col-span-3 flex items-center min-w-0">
          {description ? (
            <TruncatedText as="p" className="text-sm text-muted-foreground line-clamp-2">
              {description}
            </TruncatedText>
          ) : (
            <span className="text-sm text-muted-foreground">-</span>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}