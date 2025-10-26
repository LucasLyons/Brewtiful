'use client'

import { useState, useEffect } from 'react'
import { Star } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { StarRating } from '@/components/shared/star-rating'
import { getUserRating } from '@/lib/ratings/get-user-ratings'
import { submitRating, removeRating } from '@/lib/ratings/submit-rating'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import type { User } from '@supabase/supabase-js'

interface BeerRatingButtonProps {
  beerId: number
  breweryId: number
  className?: string
  initialRating?: number | null
}

/**
 * Single star rating button for list view with popover rating interface.
 *
 * Features:
 * - Shows hollow star if unrated, solid yellow star if rated
 * - Clicking opens a popover with the full 5-star rating interface
 * - Only works for authenticated users
 * - Automatically fetches and updates rating state
 *
 * Performance:
 * - Pass initialRating prop to avoid N+1 queries when rendering lists
 * - If not provided, will fetch rating on mount (slower)
 *
 * @param beerId - The beer ID being rated
 * @param breweryId - The brewery ID (required for user_ratings table)
 * @param className - Additional CSS classes
 * @param initialRating - Pre-fetched rating value (optional, recommended for lists)
 */
export function BeerRatingButton({
  beerId,
  breweryId,
  className,
  initialRating
}: BeerRatingButtonProps) {
  const [rating, setRating] = useState<number | null>(initialRating ?? null)
  const [user, setUser] = useState<User | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(initialRating === undefined)
  const [showTooltip, setShowTooltip] = useState(false)
  const supabase = createClient()

  // Fetch user and rating on mount (only if not pre-fetched)
  useEffect(() => {
    const fetchData = async () => {
      // Get current user
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      setUser(currentUser)

      // Fetch rating if not pre-fetched and user is authenticated
      if (initialRating === undefined && currentUser) {
        const userRating = await getUserRating(
          beerId,
          breweryId,
          currentUser.id
        )
        setRating(userRating)
      }

      setIsLoading(false)
    }

    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [beerId, breweryId, initialRating])

  const handleOpenChange = (open: boolean) => {
    // If trying to open but user is not authenticated, show tooltip
    if (open && !user) {
      setShowTooltip(true)
      setTimeout(() => {
        setShowTooltip(false)
      }, 2000)
      return
    }
    setIsOpen(open)
  }

  const handleRate = async (newRating: number) => {
    if (!user) {
      console.error('User must be authenticated to rate')
      return
    }

    try {
      await submitRating({
        beerId,
        breweryId,
        rating: newRating,
        userId: user.id
      })

      setRating(newRating)
      setIsOpen(false) // Close popover after rating
    } catch (error) {
      console.error('Failed to submit rating:', error)
    }
  }

  const handleRemoveRating = async () => {
    if (!user) return

    try {
      await removeRating({
        beerId,
        breweryId,
        userId: user.id
      })

      setRating(null)
    } catch (error) {
      console.error('Failed to remove rating:', error)
    }
  }

  if (isLoading) {
    return (
      <div className={cn('flex items-center justify-center', className)}>
        <Star className="h-5 w-5 text-gray-300 dark:text-gray-600 animate-pulse" />
      </div>
    )
  }

  return (
    <TooltipProvider>
      {!user ? (
        <Tooltip open={showTooltip} onOpenChange={setShowTooltip}>
          <Popover open={isOpen} onOpenChange={handleOpenChange}>
            <TooltipTrigger asChild>
              <PopoverTrigger asChild>
                <button
                  className={cn(
                    'flex items-center justify-center transition-transform hover:scale-110',
                    className
                  )}
                  onClick={(e) => {
                    e.stopPropagation() // Prevent triggering row click if in a clickable row
                  }}
                >
                  {rating !== null ? (
                    <Star className="h-5 w-5 text-yellow-400 fill-yellow-400" />
                  ) : (
                    <Star className="h-5 w-5 text-yellow-400" />
                  )}
                </button>
              </PopoverTrigger>
            </TooltipTrigger>
            <PopoverContent className="w-auto p-4" align="center">
              <div className="space-y-3">
                <div className="text-sm font-medium">Rate this beer</div>
                <StarRating
                  initialRating={rating}
                  onRate={handleRate}
                  size="lg"
                />
                {rating !== null && (
                  <button
                    onClick={handleRemoveRating}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Remove rating
                  </button>
                )}
              </div>
            </PopoverContent>
          </Popover>
          <TooltipContent>
            <p>Log in to rate beers!</p>
          </TooltipContent>
        </Tooltip>
      ) : (
        <Popover open={isOpen} onOpenChange={handleOpenChange}>
          <PopoverTrigger asChild>
            <button
              className={cn(
                'flex items-center justify-center transition-transform hover:scale-110',
                className
              )}
              onClick={(e) => {
                e.stopPropagation() // Prevent triggering row click if in a clickable row
              }}
            >
              {rating !== null ? (
                <Star className="h-5 w-5 text-yellow-400 fill-yellow-400" />
              ) : (
                <Star className="h-5 w-5 text-yellow-400" />
              )}
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-4" align="center">
            <div className="space-y-3">
              <div className="text-sm font-medium">Rate this beer</div>
              <StarRating
                initialRating={rating}
                onRate={handleRate}
                size="lg"
              />
              {rating !== null && (
                <button
                  onClick={handleRemoveRating}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  Remove rating
                </button>
              )}
            </div>
          </PopoverContent>
        </Popover>
      )}
    </TooltipProvider>
  )
}
