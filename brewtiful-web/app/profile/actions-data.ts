'use server'

import {
  getRatedBeers,
  getSavedBeers,
  getSavedBreweries
} from '@/lib/profile/get-profile-data'

export async function fetchRatedBeersPage(page: number, pageSize: number = 12) {
  return await getRatedBeers(page, pageSize)
}

export async function fetchSavedBeersPage(page: number, pageSize: number = 12) {
  return await getSavedBeers(page, pageSize)
}

export async function fetchSavedBreweriesPage(page: number, pageSize: number = 12) {
  return await getSavedBreweries(page, pageSize)
}
