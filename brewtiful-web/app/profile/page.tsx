import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getRatedBeers, getSavedBeers, getSavedBreweries } from '@/lib/profile/get-profile-data'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { BeersView } from '@/components/beer/beers-view'
import { BreweriesView } from '@/components/brewery/breweries-view'
import { getSavedBeerIds, getSavedBreweryIds } from '@/lib/saved/get-saved-items'
import { getUserRatingsBulk } from '@/lib/ratings/get-ratings-bulk'

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
    <div className="min-h-screen">
      {/* Header */}
      <div className="border-b">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold">{displayName}&apos;s Profile</h1>
          <p className="text-muted-foreground mt-1">
            Your rated and saved beers and breweries
          </p>

          {/* Stats */}
          <div className="flex gap-6 mt-4 text-sm">
            <div>
              <span className="font-semibold text-foreground">{ratedBeers.length}</span>
              <span className="text-muted-foreground"> Rated</span>
            </div>
            <div>
              <span className="font-semibold text-foreground">{savedBeers.length}</span>
              <span className="text-muted-foreground"> Saved Beers</span>
            </div>
            <div>
              <span className="font-semibold text-foreground">{savedBreweries.length}</span>
              <span className="text-muted-foreground"> Saved Breweries</span>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="rated" className="w-full">
          <TabsList>
            <TabsTrigger value="rated">Rated Beers ({ratedBeers.length})</TabsTrigger>
            <TabsTrigger value="saved-beers">Saved Beers ({savedBeers.length})</TabsTrigger>
            <TabsTrigger value="saved-breweries">Saved Breweries ({savedBreweries.length})</TabsTrigger>
          </TabsList>

          {/* Rated Beers Tab */}
          <TabsContent value="rated" className="mt-6">
            {ratedBeers.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-lg text-muted-foreground">
                  You haven&apos;t rated any beers yet.
                </p>
                <Link
                  href="/beers"
                  className="inline-block mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
                >
                  Browse Beers
                </Link>
              </div>
            ) : (
              <BeersView
                beers={ratedBeers}
                savedBeerIds={savedBeerIds}
                userRatings={userRatings}
              />
            )}
          </TabsContent>

          {/* Saved Beers Tab */}
          <TabsContent value="saved-beers" className="mt-6">
            {savedBeers.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-lg text-muted-foreground">
                  You haven&apos;t saved any beers yet.
                </p>
                <Link
                  href="/beers"
                  className="inline-block mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
                >
                  Browse Beers
                </Link>
              </div>
            ) : (
              <BeersView
                beers={savedBeers}
                savedBeerIds={savedBeerIds}
                userRatings={userRatings}
              />
            )}
          </TabsContent>

          {/* Saved Breweries Tab */}
          <TabsContent value="saved-breweries" className="mt-6">
            {savedBreweries.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-lg text-muted-foreground">
                  You haven&apos;t saved any breweries yet.
                </p>
                <Link
                  href="/breweries"
                  className="inline-block mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
                >
                  Browse Breweries
                </Link>
              </div>
            ) : (
              <BreweriesView
                breweries={savedBreweries}
                savedBreweryIds={savedBreweryIds}
              />
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
