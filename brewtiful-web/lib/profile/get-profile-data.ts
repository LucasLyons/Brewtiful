'use server'

import { createClient } from '@/lib/supabase/server'

interface BeerWithBrewery {
  beer_id: number
  name: string
  style: string | null
  super_style: string | null
  abv: number | null
  active: string | null
  brewery: {
    brewery_id: number
    name: string
    city: string | null
    country: string | null
  } | null
}

interface RatedBeerData {
  rating: number
  beer_id: number
  brewery_id: number
  beers: BeerWithBrewery | null
}

/**
 * Fetches all rated beers with full details for the current user
 */
export async function getRatedBeers() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return []
  }

  const { data, error } = await supabase
    .from('user_ratings')
    .select(`
      rating,
      beer_id,
      brewery_id,
      beers (
        beer_id,
        name,
        style,
        super_style,
        abv,
        active,
        brewery:breweries!beers_brewery_id_fkey (
          brewery_id,
          name,
          city,
          country
        )
      )
    `)
    .eq('user_id', user.id)
    .order('rating', { ascending: false })

  if (error) {
    console.error('Error fetching rated beers:', error)
    return []
  }

  // Transform the data to flatten the structure
  const typedData = data as unknown as RatedBeerData[]
  return typedData
    .filter(row => row.beers) // Filter out any null beers first
    .map(row => ({
      beer_id: String(row.beers!.beer_id),
      name: row.beers!.name,
      brewery_id: row.brewery_id,
      style: row.beers!.style || '',
      abv: row.beers!.abv ?? undefined,
      active: row.beers!.active as 'Active' | 'Inactive' | 'Unknown' | undefined,
      brewery: {
        name: row.beers!.brewery?.name || '',
        country: row.beers!.brewery?.country ?? undefined,
        city: row.beers!.brewery?.city ?? undefined
      },
      rating: row.rating
    }))
}

interface SavedBeerData {
  ts: string
  beer_id: number
  brewery_id: number
  beers: BeerWithBrewery | null
}

/**
 * Fetches all saved beers with full details for the current user
 */
export async function getSavedBeers() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return []
  }

  const { data, error } = await supabase
    .from('user_saved_beers')
    .select(`
      ts,
      beer_id,
      brewery_id,
      beers (
        beer_id,
        name,
        style,
        super_style,
        abv,
        active,
        brewery:breweries!beers_brewery_id_fkey (
          brewery_id,
          name,
          city,
          country
        )
      )
    `)
    .eq('user_id', user.id)
    .order('ts', { ascending: false })

  if (error) {
    console.error('Error fetching saved beers:', error)
    return []
  }

  // Transform the data to flatten the structure
  const typedData = data as unknown as SavedBeerData[]
  return typedData
    .filter(row => row.beers) // Filter out any null beers first
    .map(row => ({
      beer_id: String(row.beers!.beer_id),
      name: row.beers!.name,
      brewery_id: row.brewery_id,
      style: row.beers!.style || '',
      abv: row.beers!.abv ?? undefined,
      active: row.beers!.active as 'Active' | 'Inactive' | 'Unknown' | undefined,
      brewery: {
        name: row.beers!.brewery?.name || '',
        country: row.beers!.brewery?.country ?? undefined,
        city: row.beers!.brewery?.city ?? undefined
      },
      saved_at: row.ts
    }))
}

interface BreweryData {
  brewery_id: number
  name: string
  city: string | null
  country: string | null
  province_or_state: string | null
  active: boolean | null
}

interface SavedBreweryData {
  ts: string
  brewery_id: number
  breweries: BreweryData | null
}

/**
 * Fetches all saved breweries with full details for the current user
 */
export async function getSavedBreweries() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return []
  }

  const { data, error } = await supabase
    .from('user_saved_breweries')
    .select(`
      ts,
      brewery_id,
      breweries (
        brewery_id,
        name,
        city,
        country,
        province_or_state,
        active
      )
    `)
    .eq('user_id', user.id)
    .order('ts', { ascending: false })

  if (error) {
    console.error('Error fetching saved breweries:', error)
    return []
  }

  // Transform the data to flatten the structure
  const typedData = data as unknown as SavedBreweryData[]
  return typedData
    .filter(row => row.breweries) // Filter out any null breweries first
    .map(row => ({
      brewery_id: String(row.breweries!.brewery_id),
      name: row.breweries!.name,
      city: row.breweries!.city ?? undefined,
      country: row.breweries!.country ?? undefined,
      province_or_state: row.breweries!.province_or_state ?? undefined,
      saved_at: row.ts
    }))
}
