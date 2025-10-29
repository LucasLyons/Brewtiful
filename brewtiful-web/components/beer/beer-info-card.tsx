"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Beer, MapPin, Building2, CheckCircle2, XCircle, HelpCircle } from "lucide-react";
import { ClickableFilter } from "@/components/shared/clickable-filter";
import { StarRating } from "@/components/shared/star-rating";
import { FlagButtons } from "@/components/beer/flag-buttons";
import { getUserRating } from '@/lib/ratings/get-user-ratings';
import { submitRating, removeRating } from '@/lib/ratings/submit-rating';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';

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
  flag_active?: number;
  flag_inactive?: number;
  user_flagged_active?: boolean | null;
  is_authenticated?: boolean;
  brewery: Brewery | Brewery[];
}

interface BeerInfoCardProps {
  beer: BeerData;
}

export function BeerInfoCard({ beer }: BeerInfoCardProps) {
  // Handle brewery being an array (from Supabase join)
  const brewery = Array.isArray(beer.brewery) ? beer.brewery[0] : beer.brewery;

  const [rating, setRating] = useState<number | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [showError, setShowError] = useState(false);
  const [reviewCount, setReviewCount] = useState<number>(beer.user_review_count);
  const supabase = createClient();

  // Fetch user and rating on mount
  useEffect(() => {
    const fetchData = async () => {
      // Get current user
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      setUser(currentUser);

      // Fetch rating if user is authenticated and brewery exists
      if (currentUser && brewery) {
        const userRating = await getUserRating(
          beer.beer_id,
          brewery.brewery_id,
          currentUser.id
        );
        setRating(userRating);
      }
    };

    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [beer.beer_id, brewery]);

  const handleDisabledClick = () => {
    setShowError(true);
    setTimeout(() => {
      setShowError(false);
    }, 3000);
  };

  const handleRate = async (newRating: number) => {
    if (!user || !brewery) {
      return;
    }

    const wasFirstRating = rating === null;

    try {
      // Optimistic update
      if (wasFirstRating) {
        setReviewCount(prev => prev + 1);
      }
      setRating(newRating);

      await submitRating({
        beerId: beer.beer_id,
        breweryId: brewery.brewery_id,
        rating: newRating,
        userId: user.id
      });
    } catch (error) {
      console.error('Failed to submit rating:', error);
      // Revert on error
      if (wasFirstRating) {
        setReviewCount(prev => Math.max(0, prev - 1));
      }
      setRating(rating);
    }
  };

  const handleRemoveRating = async () => {
    if (!user || !brewery) return;

    const previousRating = rating;

    try {
      // Optimistic update
      setReviewCount(prev => Math.max(0, prev - 1));
      setRating(null);

      await removeRating({
        beerId: beer.beer_id,
        breweryId: brewery.brewery_id,
        userId: user.id
      });
    } catch (error) {
      console.error('Failed to remove rating:', error);
      // Revert on error
      setReviewCount(prev => prev + 1);
      setRating(previousRating);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <CardTitle className="flex items-center gap-2 text-3xl flex-1">
            <Beer className="h-8 w-8" />
            {beer.name}
          </CardTitle>
        </div>
        <div className="pt-4 flex flex-col gap-2">
          <StarRating
            initialRating={rating}
            onRate={handleRate}
            size="lg"
            disabled={!user}
            onDisabledClick={handleDisabledClick}
          />
          {!user && showError && (
            <p className="text-sm text-red-600 dark:text-red-500">
              Please log in to rate
            </p>
          )}
          {rating !== null && user && (
            <button
              onClick={handleRemoveRating}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors text-left"
            >
              Remove rating
            </button>
          )}
        </div>
        {/* Flag Buttons */}
        <div className="pt-4">
          <FlagButtons
            beerId={beer.beer_id}
            initialFlagActive={beer.flag_active || 0}
            initialFlagInactive={beer.flag_inactive || 0}
            userFlaggedActive={beer.user_flagged_active ?? null}
            isAuthenticated={beer.is_authenticated || false}
          />
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
          {reviewCount !== null && reviewCount !== undefined && (
            <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
              <Beer className="h-5 w-5 mt-0.5 text-primary shrink-0" />
              <div className="space-y-1">
                <div className="text-sm font-medium">Reviews</div>
                <div className="text-sm text-muted-foreground">
                  {reviewCount.toLocaleString()}
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
