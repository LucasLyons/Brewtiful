import { createClient } from '@/lib/supabase/server'

/**
 * Migrates anonymous user data (ratings and saved items) to an authenticated user account.
 *
 * This function should be called after a user successfully signs in or creates an account.
 * It transfers all data associated with their anonymous client_id to their new user_id.
 *
 * @param userId - The authenticated user's UUID from auth.users
 * @param clientId - The client_id that was used before authentication
 *
 * @returns Object containing the number of migrated ratings and saved items
 *
 * @example
 * ```typescript
 * // In a Server Action after login
 * export async function loginAction(formData: FormData) {
 *   const supabase = await createClient()
 *
 *   const { data, error } = await supabase.auth.signInWithPassword({
 *     email: formData.get('email') as string,
 *     password: formData.get('password') as string,
 *   })
 *
 *   if (data.user) {
 *     const clientId = cookies().get('brewtiful_client_id')?.value
 *     if (clientId) {
 *       await migrateAnonymousData(data.user.id, clientId)
 *     }
 *   }
 * }
 * ```
 */
export async function migrateAnonymousData(
  userId: string,
  clientId: string
): Promise<{
  migratedRatings: number
  migratedSavedBeers: number
  migratedSavedBreweries: number
  errors: string[]
}> {
  const supabase = await createClient()
  const errors: string[] = []
  let migratedRatings = 0
  let migratedSavedBeers = 0
  let migratedSavedBreweries = 0

  try {
    // Migrate ratings from anonymous to authenticated user
    // Only migrate ratings where user_id is NULL (anonymous ratings)
    const { data: ratings, error: ratingsError } = await supabase
      .from('user_ratings')
      .update({ user_id: userId })
      .eq('client_id', clientId)
      .is('user_id', null)
      .select()

    if (ratingsError) {
      errors.push(`Ratings migration error: ${ratingsError.message}`)
    } else {
      migratedRatings = ratings?.length || 0
    }
  } catch (error) {
    errors.push(`Ratings migration exception: ${error}`)
  }

  try {
    // Migrate saved beers from anonymous to authenticated user
    const { data: savedBeers, error: savedBeersError } = await supabase
      .from('user_saved_beers')
      .update({ user_id: userId })
      .is('user_id', null)
      .select()

    if (savedBeersError) {
      errors.push(`Saved beers migration error: ${savedBeersError.message}`)
    } else {
      migratedSavedBeers = savedBeers?.length || 0
    }
  } catch (error) {
    errors.push(`Saved beers migration exception: ${error}`)
  }

  try {
    // Migrate saved breweries from anonymous to authenticated user
    const { data: savedBreweries, error: savedBreweriesError } = await supabase
      .from('user_saved_breweries')
      .update({ user_id: userId })
      .is('user_id', null)
      .select()

    if (savedBreweriesError) {
      errors.push(
        `Saved breweries migration error: ${savedBreweriesError.message}`
      )
    } else {
      migratedSavedBreweries = savedBreweries?.length || 0
    }
  } catch (error) {
    errors.push(`Saved breweries migration exception: ${error}`)
  }

  return {
    migratedRatings,
    migratedSavedBeers,
    migratedSavedBreweries,
    errors,
  }
}

/**
 * Alternative migration approach using service role for bypassing RLS.
 * Use this if the standard migration function encounters RLS policy issues.
 *
 * IMPORTANT: This function requires SUPABASE_SERVICE_ROLE_KEY environment variable
 * and should only be called from secure server-side contexts.
 *
 * @param userId - The authenticated user's UUID from auth.users
 * @param clientId - The client_id that was used before authentication
 */
export async function migrateAnonymousDataServiceRole(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  userId: string,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  clientId: string
): Promise<{
  migratedRatings: number
  migratedSavedBeers: number
  migratedSavedBreweries: number
  errors: string[]
}> {
  // This would require setting up a service role client
  // Only use if RLS policies prevent normal migration
  throw new Error(
    'Service role migration not implemented. Use migrateAnonymousData() instead.'
  )
}
