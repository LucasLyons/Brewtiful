import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import {
  getRatedBeers,
  getRatedBeersCount,
  getSavedBeers,
  getSavedBeersCount,
  getSavedBreweries,
  getSavedBreweriesCount
} from '@/lib/profile/get-profile-data'
import { getSavedBeerIds, getSavedBreweryIds } from '@/lib/saved/get-saved-items'
import { getUserRatingsBulk } from '@/lib/ratings/get-ratings-bulk'
import { ProfileContent } from '@/components/profile/profile-content'

const ITEMS_PER_PAGE = 12

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Redirect to login if not authenticated
  if (!user) {
    redirect('/login?redirectTo=/profile')
  }

  const params = await searchParams
  const ratedPage = parseInt((params.ratedPage as string) || '1')
  const savedBeersPage = parseInt((params.savedBeersPage as string) || '1')
  const savedBreweriesPage = parseInt((params.savedBreweriesPage as string) || '1')

  // Fetch all profile data in parallel including counts
  const [
    ratedBeers,
    ratedBeersCount,
    savedBeers,
    savedBeersCount,
    savedBreweries,
    savedBreweriesCount,
    savedBeerIds,
    savedBreweryIds,
    userRatings
  ] = await Promise.all([
    getRatedBeers(ratedPage, ITEMS_PER_PAGE),
    getRatedBeersCount(),
    getSavedBeers(savedBeersPage, ITEMS_PER_PAGE),
    getSavedBeersCount(),
    getSavedBreweries(savedBreweriesPage, ITEMS_PER_PAGE),
    getSavedBreweriesCount(),
    getSavedBeerIds(),
    getSavedBreweryIds(),
    getUserRatingsBulk()
  ])

  const displayName = user.user_metadata?.display_name || user.email?.split('@')[0] || 'User'

  return (
    <ProfileContent
      displayName={displayName}
      initialRatedBeers={ratedBeers}
      initialSavedBeers={savedBeers}
      initialSavedBreweries={savedBreweries}
      ratedBeersCount={ratedBeersCount}
      savedBeersCount={savedBeersCount}
      savedBreweriesCount={savedBreweriesCount}
      ratedBeersPage={ratedPage}
      savedBeersPage={savedBeersPage}
      savedBreweriesPage={savedBreweriesPage}
      itemsPerPage={ITEMS_PER_PAGE}
      savedBeerIds={savedBeerIds}
      savedBreweryIds={savedBreweryIds}
      userRatings={userRatings}
    />
  )
}
