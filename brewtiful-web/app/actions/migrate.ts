'use server'

import { migrateAnonymousData } from '@/lib/ratings/migrate-anonymous'
import { createClient } from '@/lib/supabase/server'

/**
 * Server Action to migrate anonymous user data to authenticated user.
 * Called from the client-side migration page after backing up the client_id.
 *
 * @param clientId - The anonymous client_id to migrate from
 * @returns Migration results including counts and errors
 */
export async function migrateUserData(clientId: string) {
  const supabase = await createClient()

  // Get the authenticated user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return {
      success: false,
      error: 'User not authenticated',
      migratedRatings: 0,
      migratedSavedBeers: 0,
      migratedSavedBreweries: 0,
      migratedEvents: 0,
    }
  }

  // Perform the migration
  const result = await migrateAnonymousData(user.id, clientId)

  return {
    success: result.errors.length === 0,
    error: result.errors.length > 0 ? result.errors.join(', ') : null,
    migratedRatings: result.migratedRatings,
    migratedSavedBeers: result.migratedSavedBeers,
    migratedSavedBreweries: result.migratedSavedBreweries,
    migratedEvents: result.migratedEvents,
  }
}
