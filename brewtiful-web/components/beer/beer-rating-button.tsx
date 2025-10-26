'use client'

import { useState, useEffect } from 'react'
import { Star } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { StarRating } from '@/components/shared/star-rating'
import { getUserRating } from '@/lib/ratings/get-user-ratings'
import { submitRating, removeRating } from '@/lib/ratings/submit-rating'
import { useClientId } from '@/components/providers/client-id-provider'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import type { User } from '@supabase/supabase-js'

interface BeerRatingButtonProps {
  beerId: number
  breweryId: number
  className?: string
}

/**
 * Single star rating button for list view with popover rating interface.
 *
 * Features:
 * - Shows hollow star if unrated, solid yellow star if rated
 * - Clicking opens a popover with the full 5-star rating interface
 * - Supports both authenticated and anonymous users
 * - Automatically fetches and updates rating state
 *
 * @param beerId - The beer ID being rated
 * @param breweryId - The brewery ID (required for user_ratings table)
 * @param className - Additional CSS classes
 */
export function BeerRatingButton({
  beerId,
  breweryId,
  className
}: BeerRatingButtonProps) {
  const [rating, setRating] = useState<number | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const clientId = useClientId()
  const supabase = createClient()

  // Fetch user and rating on mount
  useEffect(() => {
    const fetchData = async () => {
      // Get current user
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      setUser(currentUser)

      // Fetch rating if we have clientId
      if (clientId) {
        const userRating = await getUserRating(
          beerId,
          breweryId,
          currentUser?.id || null,
          clientId
        )
        setRating(userRating)
      }

      setIsLoading(false)
    }

    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [beerId, breweryId, clientId])

  const handleRate = async (newRating: number) => {
    if (!clientId) {
      console.error('Client ID not available')
      return
    }

    try {
      await submitRating({
        beerId,
        breweryId,
        rating: newRating,
        userId: user?.id || null,
        clientId
      })

      setRating(newRating)
      setIsOpen(false) // Close popover after rating
    } catch (error) {
      console.error('Failed to submit rating:', error)
    }
  }

  const handleRemoveRating = async () => {
    if (!clientId) return

    try {
      await removeRating({
        beerId,
        breweryId,
        userId: user?.id || null,
        clientId
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
    <Popover open={isOpen} onOpenChange={setIsOpen}>
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
  )
}
