import { createClient } from '@/lib/supabase/server'
import { SplashPage } from '@/components/layout/splash-page'
import { AuthLandingPage } from '@/components/layout/auth-landing-page'
import { getUserRecommendations } from '@/lib/recommendations/user-recommendations'
import { getSavedBeerIds } from '@/lib/saved/get-saved-items'
import { getUserRatingsBulk } from '@/lib/ratings/get-ratings-bulk'
import { BeersView } from '@/components/beer/beers-view'
import Link from 'next/link'

const MINIMUM_RATINGS_FOR_RECS = 5

interface HomeProps {
  searchParams: Promise<{
    showInactive?: string
  }>
}

export default async function Home({ searchParams }: HomeProps) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Show splash page for unauthenticated users
  if (!user) {
    return <SplashPage />
  }

  // Get user's rating count
  const { count: ratingCount } = await supabase
    .from('user_ratings')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)

  // Show onboarding page if user has less than 5 ratings
  if ((ratingCount ?? 0) < MINIMUM_RATINGS_FOR_RECS) {
    return <AuthLandingPage userId={user.id} />
  }

  // Show personalized recommendations for authenticated users with 5+ ratings
  const params = await searchParams
  const showInactive = params.showInactive === 'true'

  // Fetch personalized recommendations
  const recommendations = await getUserRecommendations(user.id, showInactive)

  // Fetch saved beer IDs and ratings for the current user
  const savedBeerIds = await getSavedBeerIds()
  const userRatings = await getUserRatingsBulk()

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="border-b">
        <div className="container mx-auto px-4 py-6">
          <div>
            <h1 className="text-3xl font-bold">For You</h1>
            <p className="text-muted-foreground mt-1">
              Personalized beer recommendations based on your ratings
            </p>
          </div>

          {/* Rating count badge */}
          <div className="flex items-center gap-4 mt-4">
            <div className="text-sm text-muted-foreground">
              Based on <span className="font-semibold text-foreground">{ratingCount}</span> ratings
            </div>
            {!showInactive && (
              <Link
                href="/?showInactive=true"
                className="text-sm text-primary hover:underline"
              >
                Show inactive beers
              </Link>
            )}
            {showInactive && (
              <Link
                href="/"
                className="text-sm text-primary hover:underline"
              >
                Hide inactive beers
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        {recommendations.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-lg text-muted-foreground">
              No recommendations available at this time.
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Try rating more beers to improve your recommendations.
            </p>
            <Link href="/beers" className="inline-block mt-6 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90">
              Browse Beers
            </Link>
          </div>
        ) : (
          <BeersView
            beers={recommendations}
            savedBeerIds={savedBeerIds}
            userRatings={userRatings}
          />
        )}
      </div>
    </div>
  )
}
