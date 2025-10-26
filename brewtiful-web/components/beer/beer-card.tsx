"use client";

import { useRef, useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Beer, MapPin, CheckCircle2, XCircle, HelpCircle } from "lucide-react";
import { ClickableFilter } from "@/components/shared/clickable-filter";
import { StarRating } from "@/components/shared/star-rating";
import { SaveBeerButton } from "@/components/shared/save-beer-button";
import { getUserRating } from '@/lib/ratings/get-user-ratings';
import { submitRating, removeRating } from '@/lib/ratings/submit-rating';
import { useClientId } from '@/components/providers/client-id-provider';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';

interface BeerCardProps {
  beerId: string;
  name: string;
  brewery: string;
  breweryId: number;
  style: string;
  abv?: number;
  country?: string;
  city?: string;
  description?: string;
  active?: 'Active' | 'Inactive' | 'Unknown';
  isSaved?: boolean;
  initialRating?: number | null;
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

function BeerDescription({ description }: { description: string }) {
  const descRef = useRef<HTMLParagraphElement>(null);
  const [isTruncated, setIsTruncated] = useState(false);

  useEffect(() => {
    const element = descRef.current;
    if (element) {
      setIsTruncated(element.scrollHeight > element.clientHeight);
    }
  }, [description]);

  const descriptionText = (
    <p
      ref={descRef}
      className="text-sm text-muted-foreground line-clamp-3"
    >
      {description}
    </p>
  );

  if (isTruncated) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          {descriptionText}
        </TooltipTrigger>
        <TooltipContent className="max-w-md">
          <p className="whitespace-pre-wrap">{description}</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  return descriptionText;
}

export function BeerCard({
  beerId,
  name,
  brewery,
  breweryId,
  style,
  abv,
  country,
  city,
  description,
  active = 'Active',
  isSaved,
  initialRating
}: BeerCardProps) {
  const [rating, setRating] = useState<number | null>(initialRating ?? null);
  const [user, setUser] = useState<User | null>(null);
  const clientId = useClientId();
  const supabase = createClient();

  // Fetch user and rating on mount (only if not pre-fetched)
  useEffect(() => {
    const fetchData = async () => {
      // Get current user
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      setUser(currentUser);

      // Fetch rating if not pre-fetched and we have clientId
      if (initialRating === undefined && clientId) {
        const userRating = await getUserRating(
          parseInt(beerId),
          breweryId,
          currentUser?.id || null,
          clientId
        );
        setRating(userRating);
      }
    };

    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [beerId, breweryId, clientId, initialRating]);

  const handleRate = async (newRating: number) => {
    if (!clientId) {
      console.error('Client ID not available');
      return;
    }

    try {
      await submitRating({
        beerId: parseInt(beerId),
        breweryId,
        rating: newRating,
        userId: user?.id || null,
        clientId
      });

      setRating(newRating);
    } catch (error) {
      console.error('Failed to submit rating:', error);
    }
  };

  const handleRemoveRating = async () => {
    if (!clientId) return;

    try {
      await removeRating({
        beerId: parseInt(beerId),
        breweryId,
        userId: user?.id || null,
        clientId
      });

      setRating(null);
    } catch (error) {
      console.error('Failed to remove rating:', error);
    }
  };

  return (
    <TooltipProvider delayDuration={1000}>
      <Card className="flex flex-col h-full hover:shadow-lg dark:hover:bg-white/5 transition-all">
        <CardHeader>
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-xl flex-1 min-w-0 line-clamp-2">
              <Link
                href={`/beers/${beerId}`}
                className="hover:text-primary hover:underline transition-colors"
              >
                {name}
              </Link>
            </CardTitle>
            <div className="flex items-center gap-2 shrink-0">
              <SaveBeerButton beerId={parseInt(beerId)} breweryId={breweryId} initialIsSaved={isSaved} />
              <Badge variant="secondary">
                {abv}%
              </Badge>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="cursor-help">
                    {active === 'Active' ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-500" />
                    ) : active === 'Inactive' ? (
                      <XCircle className="h-5 w-5 text-red-600 dark:text-red-500" />
                    ) : (
                      <HelpCircle className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                    )}
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{active}</p>
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
                <span className="truncate flex gap-1">
                  {city && (
                    <>
                      <ClickableFilter
                        value={city}
                        filterType="city"
                        basePath="/beers"
                      />
                      {country && <span>,</span>}
                    </>
                  )}
                  {country && (
                    <ClickableFilter
                      value={country}
                      filterType="country"
                      basePath="/beers"
                    />
                  )}
                </span>
              </CardDescription>
            )}
          </div>
        </CardHeader>

        <CardContent className="flex-1">
          <div className="space-y-3">
            <Badge variant="outline" className="truncate max-w-full hover:bg-primary/10 transition-colors">
              <ClickableFilter
                value={style}
                filterType="style"
                basePath="/beers"
                className="hover:no-underline"
              />
            </Badge>

            <div className="flex flex-col gap-2 text-sm">
              <StarRating
                initialRating={rating}
                onRate={handleRate}
                size="sm"
              />
              {rating !== null && (
                <button
                  onClick={handleRemoveRating}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors text-left"
                >
                  Remove rating
                </button>
              )}
            </div>

            {description && <BeerDescription description={description} />}
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