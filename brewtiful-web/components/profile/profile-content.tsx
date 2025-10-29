'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { BeersView } from '@/components/beer/beers-view'
import { BreweriesView } from '@/components/brewery/breweries-view'

interface Beer {
  beer_id: string
  brewery_id: number
  name: string
  style: string
  abv?: number
  description?: string
  active?: 'Active' | 'Inactive' | 'Unknown'
  brewery: {
    name: string
    country?: string
    city?: string
  }
}

interface Brewery {
  brewery_id: string
  name: string
  country?: string
  province_or_state?: string
  city?: string
}

interface ProfileContentProps {
  displayName: string
  initialRatedBeers: Beer[]
  initialSavedBeers: Beer[]
  initialSavedBreweries: Brewery[]
  savedBeerIds: Set<number>
  savedBreweryIds: Set<number>
  userRatings: Map<number, number>
}

export function ProfileContent({
  displayName,
  initialRatedBeers,
  initialSavedBeers,
  initialSavedBreweries,
  savedBeerIds: initialSavedBeerIds,
  savedBreweryIds: initialSavedBreweryIds,
  userRatings: initialUserRatings,
}: ProfileContentProps) {
  const [ratedBeers, setRatedBeers] = useState(initialRatedBeers)
  const [savedBeers, setSavedBeers] = useState(initialSavedBeers)
  const [savedBreweries, setSavedBreweries] = useState(initialSavedBreweries)
  const [savedBeerIds, setSavedBeerIds] = useState(initialSavedBeerIds)
  const [savedBreweryIds, setSavedBreweryIds] = useState(initialSavedBreweryIds)
  const [userRatings, setUserRatings] = useState(initialUserRatings)

  // Handler for when a beer is unrated
  const handleBeerUnrated = useCallback((beerId: number) => {
    // Remove from rated beers list
    setRatedBeers(prev => prev.filter(beer => parseInt(beer.beer_id) !== beerId))

    // Update user ratings map
    setUserRatings(prev => {
      const newMap = new Map(prev)
      newMap.delete(beerId)
      return newMap
    })
  }, [])

  // Handler for when a beer is unsaved
  const handleBeerUnsaved = useCallback((beerId: number) => {
    // Remove from saved beers list (optimistic update)
    setSavedBeers(prev => prev.filter(beer => parseInt(beer.beer_id) !== beerId))

    // Update saved beer IDs set (optimistic update)
    setSavedBeerIds(prev => {
      const newSet = new Set(prev)
      newSet.delete(beerId)
      return newSet
    })
  }, [])

  // Handler for when a brewery is unsaved
  const handleBreweryUnsaved = useCallback((breweryId: number) => {
    // Remove from saved breweries list
    setSavedBreweries(prev => prev.filter(brewery => parseInt(brewery.brewery_id) !== breweryId))

    // Update saved brewery IDs set
    setSavedBreweryIds(prev => {
      const newSet = new Set(prev)
      newSet.delete(breweryId)
      return newSet
    })
  }, [])

  // Handler for when a beer is rated (update rating value)
  const handleBeerRated = useCallback((beerId: number, rating: number) => {
    setUserRatings(prev => {
      const newMap = new Map(prev)
      newMap.set(beerId, rating)
      return newMap
    })
  }, [])

  // Handler for when a beer is saved
  const handleBeerSaved = useCallback((beerId: number) => {
    // Update saved beer IDs set
    setSavedBeerIds(prev => {
      const newSet = new Set(prev)
      newSet.add(beerId)
      return newSet
    })

    // If the beer exists in ratedBeers, also add it to savedBeers list
    setRatedBeers(currentRatedBeers => {
      const beer = currentRatedBeers.find(b => parseInt(b.beer_id) === beerId)
      if (beer) {
        setSavedBeers(currentSavedBeers => {
          // Check if already in saved beers to avoid duplicates
          const exists = currentSavedBeers.some(b => parseInt(b.beer_id) === beerId)
          if (!exists) {
            return [...currentSavedBeers, beer]
          }
          return currentSavedBeers
        })
      }
      return currentRatedBeers
    })
  }, [])

  // Handler for when a brewery is saved
  const handleBrewerySaved = useCallback((breweryId: number) => {
    setSavedBreweryIds(prev => {
      const newSet = new Set(prev)
      newSet.add(breweryId)
      return newSet
    })
  }, [])

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="border-b">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold">{displayName}&apos;s Profile</h1>
          <p className="text-muted-foreground mt-1">
            Your rated and saved beers and breweries
          </p>
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
                onBeerUnrated={handleBeerUnrated}
                onBeerSaved={handleBeerSaved}
                onBeerUnsaved={handleBeerUnsaved}
                onBeerRated={handleBeerRated}
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
                onBeerUnrated={handleBeerUnrated}
                onBeerSaved={handleBeerSaved}
                onBeerUnsaved={handleBeerUnsaved}
                onBeerRated={handleBeerRated}
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
                onBrewerySaved={handleBrewerySaved}
                onBreweryUnsaved={handleBreweryUnsaved}
              />
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
