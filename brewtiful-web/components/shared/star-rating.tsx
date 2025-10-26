'use client'

import { useState, useEffect } from 'react'
import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StarRatingProps {
  initialRating?: number | null
  onRate: (rating: number) => Promise<void>
  size?: 'sm' | 'md' | 'lg'
  readonly?: boolean
  disabled?: boolean
  onDisabledClick?: () => void
  className?: string
}

/**
 * Interactive 5-star rating component with half-star increments.
 *
 * Features:
 * - Hollow stars when unrated
 * - Hover preview with yellow fill (half-star increments)
 * - Click to save rating
 * - Supports both authenticated and anonymous users
 *
 * @param initialRating - Current user rating (null if unrated)
 * @param onRate - Callback function to handle rating submission
 * @param size - Star size variant (sm: 16px, md: 20px, lg: 24px)
 * @param readonly - If true, shows rating without interaction
 * @param disabled - If true, prevents all interactions (no hover, no click)
 * @param onDisabledClick - Callback when clicking while disabled
 * @param className - Additional CSS classes
 */
export function StarRating({
  initialRating = null,
  onRate,
  size = 'md',
  readonly = false,
  disabled = false,
  onDisabledClick,
  className
}: StarRatingProps) {
  const [rating, setRating] = useState<number | null>(initialRating)
  const [hoveredRating, setHoveredRating] = useState<number | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Update rating when initialRating changes
  useEffect(() => {
    setRating(initialRating)
  }, [initialRating])

  const handleClick = async (value: number) => {
    if (readonly || disabled || isSubmitting) return

    setIsSubmitting(true)
    try {
      await onRate(value)
      setRating(value)
    } catch (error) {
      console.error('Failed to submit rating:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleMouseMove = (index: number, event: React.MouseEvent<HTMLDivElement>) => {
    if (readonly || disabled) return

    const rect = event.currentTarget.getBoundingClientRect()
    const x = event.clientX - rect.left
    const isLeftHalf = x < rect.width / 2

    // Calculate rating with half-star increments
    const value = index + (isLeftHalf ? 0.5 : 1)
    setHoveredRating(value)
  }

  const handleMouseLeave = () => {
    if (!readonly && !disabled) {
      setHoveredRating(null)
    }
  }

  const displayRating = hoveredRating ?? rating ?? 0

  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6'
  }

  const starSize = sizeClasses[size]

  return (
    <div
      className={cn('flex items-center gap-0.5', className)}
      onMouseLeave={handleMouseLeave}
    >
      {[0, 1, 2, 3, 4].map((index) => {
        const starValue = index + 1
        const isFullStar = displayRating >= starValue
        const isHalfStar = displayRating >= starValue - 0.5 && displayRating < starValue

        return (
          <div
            key={index}
            className={cn(
              'relative',
              !readonly && !disabled && 'cursor-pointer transition-transform hover:scale-110',
              disabled && 'cursor-not-allowed opacity-70'
            )}
            onMouseMove={(e) => handleMouseMove(index, e)}
            onClick={(e) => {
              if (disabled) {
                onDisabledClick?.()
                return
              }
              const rect = e.currentTarget.getBoundingClientRect()
              const x = e.clientX - rect.left
              const isLeftHalf = x < rect.width / 2
              handleClick(index + (isLeftHalf ? 0.5 : 1))
            }}
          >
            {/* Background star (hollow) */}
            <Star
              className={cn(
                starSize,
                'text-yellow-400',
                isFullStar ? 'opacity-0' : 'opacity-100'
              )}
            />

            {/* Full star overlay */}
            {isFullStar && (
              <Star
                className={cn(
                  starSize,
                  'absolute inset-0 text-yellow-400 fill-yellow-400'
                )}
              />
            )}

            {/* Half star overlay */}
            {isHalfStar && (
              <>
                {/* Hollow outline for full star */}
                <Star
                  className={cn(
                    starSize,
                    'absolute inset-0 text-yellow-400'
                  )}
                />
                {/* Filled half star */}
                <div className="absolute inset-0 overflow-hidden" style={{ width: '50%' }}>
                  <Star
                    className={cn(
                      starSize,
                      'text-yellow-400 fill-yellow-400'
                    )}
                  />
                </div>
              </>
            )}
          </div>
        )
      })}

      {/* Display numeric rating - only show if not disabled or if there's an actual rating */}
      {rating !== null && !disabled && (
        <span className="ml-2 text-sm font-medium text-muted-foreground">
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  )
}
