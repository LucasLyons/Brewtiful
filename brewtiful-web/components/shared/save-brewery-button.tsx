'use client'

import { useState, useEffect } from 'react'
import { Bookmark } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { isBrewerySaved } from '@/lib/saved/get-user-saved'
import { saveBrewery, unsaveBrewery } from '@/lib/saved/submit-saved-brewery'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import type { User } from '@supabase/supabase-js'

interface SaveBreweryButtonProps {
  breweryId: number
  className?: string
  initialIsSaved?: boolean
}

/**
 * Bookmark button for saving breweries to user's saved list.
 *
 * Features:
 * - Shows hollow bookmark if not saved, solid bookmark if saved
 * - Only available to authenticated users
 * - Shows tooltip "Log in to save items!" for 2s when unauthenticated user clicks
 * - Logs save/unsave events to events table
 *
 * Performance:
 * - Pass initialIsSaved prop to avoid N+1 queries when rendering lists
 * - If not provided, will fetch saved state on mount (slower)
 *
 * @param breweryId - The brewery ID being saved
 * @param className - Additional CSS classes
 * @param initialIsSaved - Pre-fetched saved state (optional, recommended for lists)
 */
export function SaveBreweryButton({
  breweryId,
  className,
  initialIsSaved
}: SaveBreweryButtonProps) {
  const [isSaved, setIsSaved] = useState(initialIsSaved ?? false)
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(initialIsSaved === undefined)
  const [showTooltip, setShowTooltip] = useState(false)
  const supabase = createClient()

  // Fetch user and saved state on mount (only if not pre-fetched)
  useEffect(() => {
    const fetchData = async () => {
      // Get current user
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      setUser(currentUser)

      // Check if brewery is saved (only if not pre-fetched and user is authenticated)
      if (initialIsSaved === undefined && currentUser) {
        const saved = await isBrewerySaved(breweryId, currentUser.id)
        setIsSaved(saved)
      }

      setIsLoading(false)
    }

    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [breweryId, initialIsSaved])

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation() // Prevent triggering parent click events

    // Show tooltip for unauthenticated users
    if (!user) {
      setShowTooltip(true)
      setTimeout(() => {
        setShowTooltip(false)
      }, 2000)
      return
    }

    try {
      if (isSaved) {
        // Unsave the brewery
        await unsaveBrewery({
          breweryId,
          userId: user.id
        })
        setIsSaved(false)
      } else {
        // Save the brewery
        await saveBrewery({
          breweryId,
          userId: user.id
        })
        setIsSaved(true)
      }
    } catch (error) {
      console.error('Failed to toggle save state:', error)
    }
  }

  if (isLoading) {
    return (
      <div className={cn('flex items-center justify-center', className)}>
        <Bookmark className="h-5 w-5 text-gray-300 dark:text-gray-600 animate-pulse" />
      </div>
    )
  }

  return (
    <TooltipProvider>
      <Tooltip open={showTooltip} onOpenChange={setShowTooltip}>
        <TooltipTrigger asChild>
          <button
            className={cn(
              'flex items-center justify-center transition-transform hover:scale-110',
              className
            )}
            onClick={handleClick}
          >
            {isSaved ? (
              <Bookmark className="h-5 w-5 text-blue-500 fill-blue-500" />
            ) : (
              <Bookmark className="h-5 w-5 text-blue-500" />
            )}
          </button>
        </TooltipTrigger>
        {!user && (
          <TooltipContent>
            <p>Log in to save items!</p>
          </TooltipContent>
        )}
      </Tooltip>
    </TooltipProvider>
  )
}
