'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { BeerCard } from '@/components/beer/beer-card'
import { Button } from '@/components/ui/button'
import { Loader2, ChevronLeft, ChevronRight } from 'lucide-react'

interface Beer {
  beer_id: number
  name: string
  style: string
  abv: number | null
  description: string | null
  active: 'Active' | 'Inactive' | 'Unknown'
  brewery: {
    brewery_id: number
    name: string
    city: string | null
    country: string | null
  } | {
    brewery_id: number
    name: string
    city: string | null
    country: string | null
  }[]
}

const BEERS_PER_PAGE = 12
const MINIMUM_RATINGS_FOR_RECS = 5

export function AuthLandingPage({ userId }: { userId: string }) {
  const [ratingCount, setRatingCount] = useState<number>(0)
  const [beers, setBeers] = useState<Beer[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [totalBeers, setTotalBeers] = useState(0)
  const [loading, setLoading] = useState(true)
  const [userRatings, setUserRatings] = useState<Map<number, number>>(new Map())
  const [ratedBeerIds, setRatedBeerIds] = useState<Set<number>>(new Set())
  const supabase = createClient()

  // Fetch user's rating count
  const fetchRatingCount = async () => {
    const { count } = await supabase
      .from('user_ratings')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)

    return count ?? 0
  }

  // Fetch popular beers (sorted by scraped_review_count)
  const fetchPopularBeers = async (page: number) => {
    const from = (page - 1) * BEERS_PER_PAGE
    const to = from + BEERS_PER_PAGE - 1

    console.log('Fetching popular beers, page:', page, 'range:', from, '-', to)

    // Get total count
    const { count, error: countError } = await supabase
      .from('beers')
      .select('*', { count: 'exact', head: true })
      .order('scraped_review_count', { ascending: false })

    if (countError) {
      console.error('Error fetching beer count:', countError)
    }

    console.log('Total beers:', count)

    // Get beers for current page
    const { data, error: dataError } = await supabase
      .from('beers')
      .select(`
        beer_id,
        name,
        style,
        abv,
        description,
        active,
        brewery:breweries!beers_brewery_id_fkey (
          brewery_id,
          name,
          city,
          country
        )
      `)
      .order('scraped_review_count', { ascending: false })
      .range(from, to)

    if (dataError) {
      console.error('Error fetching beers:', dataError)
    }

    console.log('Fetched beers:', data?.length)

    return {
      beers: data ?? [],
      total: count ?? 0
    }
  }

  // Fetch user's ratings for displayed beers
  const fetchUserRatingsForBeers = async (beerIds: number[]) => {
    if (beerIds.length === 0) return new Map()

    const { data } = await supabase
      .from('user_ratings')
      .select('beer_id, rating')
      .in('beer_id', beerIds)
      .eq('user_id', userId)

    return new Map((data ?? []).map(({ beer_id, rating }) => [beer_id, rating]))
  }

  // Fetch all rated beer IDs for the user
  const fetchAllRatedBeerIds = async () => {
    const { data } = await supabase
      .from('user_ratings')
      .select('beer_id')
      .eq('user_id', userId)

    return new Set((data ?? []).map(row => row.beer_id))
  }

  // Handle rating change from BeerCard
  const handleRatingChange = (beerId: number, rating: number | null) => {
    console.log('Rating change callback:', beerId, rating)

    if (rating !== null) {
      // Add to rated beers set
      setRatedBeerIds(prev => {
        const newSet = new Set(prev)
        const wasNew = !newSet.has(beerId)
        newSet.add(beerId)

        if (wasNew) {
          // Update count immediately
          const newCount = newSet.size
          setRatingCount(newCount)
          console.log('New rating count (client-side):', newCount)

          // Check if we hit the threshold
          if (newCount >= MINIMUM_RATINGS_FOR_RECS) {
            console.log('Hit 5 ratings threshold, refreshing page...')
            window.location.reload()
          }
        }

        return newSet
      })

      // Update ratings map
      setUserRatings(prev => new Map(prev).set(beerId, rating))
    } else {
      // Remove from rated beers set
      setRatedBeerIds(prev => {
        const newSet = new Set(prev)
        newSet.delete(beerId)

        // Update count immediately
        const newCount = newSet.size
        setRatingCount(newCount)
        console.log('New rating count after removal (client-side):', newCount)

        return newSet
      })

      // Remove from ratings map
      setUserRatings(prev => {
        const newMap = new Map(prev)
        newMap.delete(beerId)
        return newMap
      })
    }
  }

  // Initial load
  useEffect(() => {
    const loadInitialData = async () => {
      console.log('Loading initial data for user:', userId)
      setLoading(true)

      try {
        // Fetch all rated beer IDs first
        const allRatedIds = await fetchAllRatedBeerIds()
        console.log('User has rated', allRatedIds.size, 'beers')
        setRatedBeerIds(allRatedIds)
        setRatingCount(allRatedIds.size)

        // If user has 5+ ratings, redirect will happen in parent
        if (allRatedIds.size >= MINIMUM_RATINGS_FOR_RECS) {
          console.log('User has enough ratings, skipping beer fetch')
          setLoading(false)
          return
        }

        const { beers: popularBeers, total } = await fetchPopularBeers(1)
        console.log('Setting beers state with', popularBeers.length, 'beers')
        setBeers(popularBeers)
        setTotalBeers(total)

        const beerIds = popularBeers.map(b => b.beer_id)
        const ratings = await fetchUserRatingsForBeers(beerIds)
        console.log('Fetched ratings for', ratings.size, 'beers')
        setUserRatings(ratings)

        setLoading(false)
        console.log('Initial data load complete')
      } catch (error) {
        console.error('Error loading initial data:', error)
        setLoading(false)
      }
    }

    loadInitialData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Real-time listener for rating changes
  useEffect(() => {
    const channel = supabase
      .channel('user_ratings_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_ratings',
          filter: `user_id=eq.${userId}`
        },
        async (payload) => {
          console.log('Rating change detected:', payload)

          // Refresh rating count
          const { count } = await supabase
            .from('user_ratings')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)

          const newCount = count ?? 0
          setRatingCount(newCount)

          // If user hit threshold, force refresh the entire page
          if (newCount >= MINIMUM_RATINGS_FOR_RECS) {
            console.log('User hit 5 ratings threshold, refreshing page...')
            window.location.reload()
            return
          }

          // Update local ratings map
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const newRating = payload.new as { beer_id: number; rating: number }
            setUserRatings(prev => new Map(prev).set(newRating.beer_id, newRating.rating))
          } else if (payload.eventType === 'DELETE') {
            const oldRating = payload.old as { beer_id: number }
            setUserRatings(prev => {
              const newMap = new Map(prev)
              newMap.delete(oldRating.beer_id)
              return newMap
            })
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Handle page changes
  const handlePageChange = async (newPage: number) => {
    setLoading(true)
    setCurrentPage(newPage)

    const { beers: popularBeers } = await fetchPopularBeers(newPage)
    setBeers(popularBeers)

    const beerIds = popularBeers.map(b => b.beer_id)
    const ratings = await fetchUserRatingsForBeers(beerIds)
    setUserRatings(ratings)

    setLoading(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const totalPages = Math.ceil(totalBeers / BEERS_PER_PAGE)
  const ratingsRemaining = Math.max(0, MINIMUM_RATINGS_FOR_RECS - ratingCount)

  if (loading && beers.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header with CTA */}
      <div className="text-center space-y-4 mb-12">
        <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-amber-600 via-orange-600 to-amber-600 dark:from-amber-500 dark:via-orange-500 dark:to-amber-500 bg-clip-text text-transparent">
          Get Started with Brewtiful
        </h1>

        <div className="space-y-2">
          <p className="text-xl text-muted-foreground">
            {ratingsRemaining > 0 ? (
              <>
                Rate <span className="font-bold text-amber-600 dark:text-amber-500">{ratingsRemaining} more {ratingsRemaining === 1 ? 'beer' : 'beers'}</span> to unlock personalized recommendations!
              </>
            ) : (
              'You&apos;ve rated 5 beers! Generating your recommendations...'
            )}
          </p>
        </div>

        <p className="text-muted-foreground">
          Get started by rating popular beers, or refine your search in the{' '}
          <Link href="/beers" className="text-amber-600 dark:text-amber-500 hover:underline font-medium">
            catalog
          </Link>. You can also explore {' '}
          <Link href="/breweries" className="text-amber-600 dark:text-amber-500 hover:underline font-medium">
            breweries
          </Link>.
        </p>
      </div>

      {/* Beer Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
            {beers.map((beer) => {
              const brewery = Array.isArray(beer.brewery)
                ? beer.brewery[0]
                : beer.brewery

              return (
                <BeerCard
                  key={beer.beer_id}
                  beerId={beer.beer_id.toString()}
                  name={beer.name}
                  brewery={brewery.name}
                  breweryId={brewery.brewery_id}
                  style={beer.style}
                  abv={beer.abv ?? undefined}
                  country={brewery.country ?? undefined}
                  city={brewery.city ?? undefined}
                  description={beer.description ?? undefined}
                  active={beer.active}
                  initialRating={userRatings.get(beer.beer_id) ?? null}
                  onRatingChange={handleRatingChange}
                />
              )
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>

              <span className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </span>

              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
