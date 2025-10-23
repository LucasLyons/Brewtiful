"use client";

import { useRef, useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Beer, MapPin, Star, CheckCircle2, XCircle } from "lucide-react";

interface BeerCardProps {
  name: string;
  brewery: string;
  breweryId: number;
  style: string;
  abv?: number;
  country?: string;
  city?: string;
  description?: string;
  active?: boolean;
}

function BreweryLink({ brewery, breweryId }: { brewery: string; breweryId: number }) {
  const linkRef = useRef<HTMLAnchorElement>(null);
  const [isTruncated, setIsTruncated] = useState(false);

  useEffect(() => {
    const element = linkRef.current;
    if (element) {
      setIsTruncated(element.scrollWidth > element.clientWidth);
    }
  }, [brewery]);

  const link = (
    <Link
      ref={linkRef}
      href={`/breweries/${breweryId}`}
      className="truncate hover:text-primary hover:underline transition-colors min-w-0 block"
      onClick={(e) => e.stopPropagation()}
    >
      {brewery}
    </Link>
  );

  if (isTruncated) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          {link}
        </TooltipTrigger>
        <TooltipContent>
          <p className="max-w-xs">{brewery}</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  return link;
}

export function BeerCard({
  name,
  brewery,
  breweryId,
  style,
  abv,
  country,
  city,
  description,
  active = true
}: BeerCardProps) {
  return (
    <TooltipProvider>
      <Card className="flex flex-col h-full hover:shadow-lg dark:hover:bg-white/5 transition-all">
        <CardHeader>
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-xl flex-1 min-w-0 line-clamp-2">
              {name}
            </CardTitle>
            <div className="flex items-center gap-2 shrink-0">
              <Badge variant="secondary">
                {abv}%
              </Badge>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="cursor-help">
                    {active ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-500" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-600 dark:text-red-500" />
                    )}
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{active ? "Active" : "Inactive"}</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
          <div className="space-y-1">
            <CardDescription className="flex items-center gap-1 min-w-0">
              <Beer className="h-4 w-4 shrink-0" />
              <BreweryLink brewery={brewery} breweryId={breweryId} />
            </CardDescription>
            {(city || country) && (
              <CardDescription className="flex items-center gap-1 min-w-0">
                <MapPin className="h-4 w-4 shrink-0" />
                <span className="truncate">
                  {[city, country].filter(Boolean).join(', ')}
                </span>
              </CardDescription>
            )}
          </div>
        </CardHeader>

        <CardContent className="flex-1">
          <div className="space-y-3">
            <Badge variant="outline" className="truncate max-w-full">{style}</Badge>

            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              </div>
            </div>

            {description && (
              <p className="text-sm text-muted-foreground line-clamp-3">
                {description}
              </p>
            )}
          </div>
        </CardContent>

        <CardFooter>
          <button className="w-full text-sm font-medium hover:underline">
            View Details →
          </button>
        </CardFooter>
      </Card>
    </TooltipProvider>
  );
}