import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getRatedBeers, getSavedBeers, getSavedBreweries } from '@/lib/profile/get-profile-data'
import { getSavedBeerIds, getSavedBreweryIds } from '@/lib/saved/get-saved-items'
import { getUserRatingsBulk } from '@/lib/ratings/get-ratings-bulk'
import { ProfileContent } from '@/components/profile/profile-content'

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Redirect to login if not authenticated
  if (!user) {
    redirect('/login?redirectTo=/profile')
  }

  // Fetch all profile data in parallel
  const [ratedBeers, savedBeers, savedBreweries, savedBeerIds, savedBreweryIds, userRatings] = await Promise.all([
    getRatedBeers(),
    getSavedBeers(),
    getSavedBreweries(),
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
      savedBeerIds={savedBeerIds}
      savedBreweryIds={savedBreweryIds}
      userRatings={userRatings}
    />
  )
}
