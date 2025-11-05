'use client'

import { useState, useCallback, useMemo, useEffect } from 'react'
import Link from 'next/link'
import { fetchRatedBeersPage, fetchSavedBeersPage, fetchSavedBreweriesPage } from '@/app/profile/actions-data'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { BeersView } from '@/components/beer/beers-view'
import { BreweriesView } from '@/components/brewery/breweries-view'
import { ProfileBeerSearch } from '@/components/profile/profile-beer-search'
import { ProfileBrewerySearch } from '@/components/profile/profile-brewery-search'
import { DeleteAccountButton } from '@/components/auth/delete-account-button'
import { ProfilePagination } from '@/components/profile/profile-pagination'

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
  ratedBeersCount: number
  savedBeersCount: number
  savedBreweriesCount: number
  ratedBeersPage: number
  savedBeersPage: number
  savedBreweriesPage: number
  itemsPerPage: number
  savedBeerIds: Set<number>
  savedBreweryIds: Set<number>
  userRatings: Map<number, number>
}

export function ProfileContent({
  displayName,
  initialRatedBeers,
  initialSavedBeers,
  initialSavedBreweries,
  ratedBeersCount,
  savedBeersCount,
  savedBreweriesCount,
  ratedBeersPage,
  savedBeersPage,
  savedBreweriesPage,
  itemsPerPage,
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

  // Track counts client-side so they update immediately
  const [currentRatedBeersCount, setCurrentRatedBeersCount] = useState(ratedBeersCount)
  const [currentSavedBeersCount, setCurrentSavedBeersCount] = useState(savedBeersCount)
  const [currentSavedBreweriesCount, setCurrentSavedBreweriesCount] = useState(savedBreweriesCount)

  // Loading states
  const [isLoadingRated, setIsLoadingRated] = useState(false)
  const [isLoadingSavedBeers, setIsLoadingSavedBeers] = useState(false)
  const [isLoadingSavedBreweries, setIsLoadingSavedBreweries] = useState(false)

  // Search query states
  const [ratedBeersSearchQuery, setRatedBeersSearchQuery] = useState("")
  const [savedBeersSearchQuery, setSavedBeersSearchQuery] = useState("")
  const [savedBreweriesSearchQuery, setSavedBreweriesSearchQuery] = useState("")

  // Fetch data when pagination changes
  useEffect(() => {
    const fetchData = async () => {
      setIsLoadingRated(true)
      const data = await fetchRatedBeersPage(ratedBeersPage, itemsPerPage)
      setRatedBeers(data)
      setIsLoadingRated(false)
    }
    fetchData()
  }, [ratedBeersPage, itemsPerPage])

  useEffect(() => {
    const fetchData = async () => {
      setIsLoadingSavedBeers(true)
      const data = await fetchSavedBeersPage(savedBeersPage, itemsPerPage)
      setSavedBeers(data)
      setIsLoadingSavedBeers(false)
    }
    fetchData()
  }, [savedBeersPage, itemsPerPage])

  useEffect(() => {
    const fetchData = async () => {
      setIsLoadingSavedBreweries(true)
      const data = await fetchSavedBreweriesPage(savedBreweriesPage, itemsPerPage)
      setSavedBreweries(data)
      setIsLoadingSavedBreweries(false)
    }
    fetchData()
  }, [savedBreweriesPage, itemsPerPage])

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

    // Decrement count
    setCurrentRatedBeersCount(prev => Math.max(0, prev - 1))
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

    // Decrement count
    setCurrentSavedBeersCount(prev => Math.max(0, prev - 1))
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

    // Decrement count
    setCurrentSavedBreweriesCount(prev => Math.max(0, prev - 1))
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
    // Track if this is a new save (not already in the Set)
    let wasNewSave = false

    // Update saved beer IDs set
    setSavedBeerIds(prev => {
      const newSet = new Set(prev)
      wasNewSave = !prev.has(beerId)
      newSet.add(beerId)
      return newSet
    })

    // Only increment count if this was a new save
    if (wasNewSave) {
      setCurrentSavedBeersCount(prevCount => prevCount + 1)
    }

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
      const wasNew = !prev.has(breweryId)
      newSet.add(breweryId)

      // Only increment count if this is a new save
      if (wasNew) {
        setCurrentSavedBreweriesCount(prevCount => prevCount + 1)
      }

      return newSet
    })
  }, [])

  // Filter beers based on search query
  const filteredRatedBeers = useMemo(() => {
    if (!ratedBeersSearchQuery) return ratedBeers

    return ratedBeers.filter(beer =>
      beer.name.toLowerCase().includes(ratedBeersSearchQuery) ||
      beer.brewery.name.toLowerCase().includes(ratedBeersSearchQuery)
    )
  }, [ratedBeers, ratedBeersSearchQuery])

  const filteredSavedBeers = useMemo(() => {
    if (!savedBeersSearchQuery) return savedBeers

    return savedBeers.filter(beer =>
      beer.name.toLowerCase().includes(savedBeersSearchQuery) ||
      beer.brewery.name.toLowerCase().includes(savedBeersSearchQuery)
    )
  }, [savedBeers, savedBeersSearchQuery])

  // Filter breweries based on search query
  // Search across name, city, and country fields
  const filteredSavedBreweries = useMemo(() => {
    if (!savedBreweriesSearchQuery) return savedBreweries

    return savedBreweries.filter(brewery =>
      brewery.name.toLowerCase().includes(savedBreweriesSearchQuery) ||
      (brewery.city && brewery.city.toLowerCase().includes(savedBreweriesSearchQuery)) ||
      (brewery.country && brewery.country.toLowerCase().includes(savedBreweriesSearchQuery))
    )
  }, [savedBreweries, savedBreweriesSearchQuery])

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold">{displayName}&apos;s Profile</h1>
              <p className="text-muted-foreground mt-1">
                Your rated and saved beers and breweries
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="rated" className="w-full">
          <TabsList>
            <TabsTrigger value="rated">Rated Beers ({currentRatedBeersCount})</TabsTrigger>
            <TabsTrigger value="saved-beers">Saved Beers ({currentSavedBeersCount})</TabsTrigger>
            <TabsTrigger value="saved-breweries">Saved Breweries ({currentSavedBreweriesCount})</TabsTrigger>
          </TabsList>

          {/* Rated Beers Tab */}
          <TabsContent value="rated" className="mt-6">
            <div className="mb-6 max-w-2xl">
              <ProfileBeerSearch onSearch={setRatedBeersSearchQuery} />
              {ratedBeersSearchQuery && (
                <p className="text-xs text-muted-foreground mt-2">
                  Searching within current page only. Clear search to browse all pages.
                </p>
              )}
            </div>
            {!ratedBeersSearchQuery && (
              <ProfilePagination
                currentPage={ratedBeersPage}
                totalItems={currentRatedBeersCount}
                itemsPerPage={itemsPerPage}
                pageParamName="ratedPage"
              />
            )}
{isLoadingRated ? (
              <div className="text-center py-16">
                <p className="text-muted-foreground">Loading...</p>
              </div>
            ) : filteredRatedBeers.length === 0 ? (
              <div className="text-center py-16 border rounded-lg bg-muted/20 max-w-3xl mx-auto">
                <p className="text-lg text-muted-foreground">
                  {ratedBeers.length === 0
                    ? "You haven't rated any beers yet."
                    : "No beers found matching your search."}
                </p>
                {ratedBeers.length === 0 && (
                  <Link
                    href="/beers"
                    className="inline-block mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
                  >
                    Browse Beers
                  </Link>
                )}
              </div>
            ) : (
              <BeersView
                beers={filteredRatedBeers}
                savedBeerIds={savedBeerIds}
                userRatings={userRatings}
                onBeerUnrated={handleBeerUnrated}
                onBeerSaved={handleBeerSaved}
                onBeerUnsaved={handleBeerUnsaved}
                onBeerRated={handleBeerRated}
                hideSearch={true}
              />
            )}
          </TabsContent>

          {/* Saved Beers Tab */}
          <TabsContent value="saved-beers" className="mt-6">
            <div className="mb-6 max-w-2xl">
              <ProfileBeerSearch onSearch={setSavedBeersSearchQuery} />
              {savedBeersSearchQuery && (
                <p className="text-xs text-muted-foreground mt-2">
                  Searching within current page only. Clear search to browse all pages.
                </p>
              )}
            </div>
            {!savedBeersSearchQuery && (
              <ProfilePagination
                currentPage={savedBeersPage}
                totalItems={currentSavedBeersCount}
                itemsPerPage={itemsPerPage}
                pageParamName="savedBeersPage"
              />
            )}
{isLoadingSavedBeers ? (
              <div className="text-center py-16">
                <p className="text-muted-foreground">Loading...</p>
              </div>
            ) : filteredSavedBeers.length === 0 ? (
              <div className="text-center py-16 border rounded-lg bg-muted/20 max-w-3xl mx-auto">
                <p className="text-lg text-muted-foreground">
                  {savedBeers.length === 0
                    ? "You haven't saved any beers yet."
                    : "No beers found matching your search."}
                </p>
                {savedBeers.length === 0 && (
                  <Link
                    href="/beers"
                    className="inline-block mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
                  >
                    Browse Beers
                  </Link>
                )}
              </div>
            ) : (
              <BeersView
                beers={filteredSavedBeers}
                savedBeerIds={savedBeerIds}
                userRatings={userRatings}
                onBeerUnrated={handleBeerUnrated}
                onBeerSaved={handleBeerSaved}
                onBeerUnsaved={handleBeerUnsaved}
                onBeerRated={handleBeerRated}
                hideSearch={true}
              />
            )}
          </TabsContent>

          {/* Saved Breweries Tab */}
          <TabsContent value="saved-breweries" className="mt-6">
            <div className="mb-6 max-w-2xl">
              <ProfileBrewerySearch onSearch={setSavedBreweriesSearchQuery} />
              {savedBreweriesSearchQuery && (
                <p className="text-xs text-muted-foreground mt-2">
                  Searching within current page only. Clear search to browse all pages.
                </p>
              )}
            </div>
            {!savedBreweriesSearchQuery && (
              <ProfilePagination
                currentPage={savedBreweriesPage}
                totalItems={currentSavedBreweriesCount}
                itemsPerPage={itemsPerPage}
                pageParamName="savedBreweriesPage"
              />
            )}
{isLoadingSavedBreweries ? (
              <div className="text-center py-16">
                <p className="text-muted-foreground">Loading...</p>
              </div>
            ) : filteredSavedBreweries.length === 0 ? (
              <div className="text-center py-16 border rounded-lg bg-muted/20 max-w-3xl mx-auto">
                <p className="text-lg text-muted-foreground">
                  {savedBreweries.length === 0
                    ? "You haven't saved any breweries yet."
                    : "No breweries found matching your search."}
                </p>
                {savedBreweries.length === 0 && (
                  <Link
                    href="/breweries"
                    className="inline-block mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
                  >
                    Browse Breweries
                  </Link>
                )}
              </div>
            ) : (
              <BreweriesView
                breweries={filteredSavedBreweries}
                savedBreweryIds={savedBreweryIds}
                onBrewerySaved={handleBrewerySaved}
                onBreweryUnsaved={handleBreweryUnsaved}
                hideSearch={true}
              />
            )}
          </TabsContent>
        </Tabs>

        {/* Delete Account Section - Moved to bottom */}
        <div className="mt-12 mb-8 rounded-lg border border-destructive/20 bg-destructive/5 p-6 max-w-3xl">
          <h2 className="text-lg font-semibold mb-2">Delete Account</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Permanently delete your account and all associated data. This action will mark your account for deletion, which will be processed by the end of the day. You can restore your account by logging in again before deletion is complete.
          </p>
          <DeleteAccountButton />
        </div>
      </div>
    </div>
  )
}
