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
  migratedSaved: number
  errors: string[]
}> {
  const supabase = await createClient()
  const errors: string[] = []
  let migratedRatings = 0
  let migratedSaved = 0

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
    // Migrate saved items from anonymous to authenticated user
    const { data: saved, error: savedError } = await supabase
      .from('user_saved')
      .update({ user_id: userId })
      .eq('user_id', clientId) // user_saved might be using client_id in user_id field
      .select()

    if (savedError) {
      errors.push(`Saved items migration error: ${savedError.message}`)
    } else {
      migratedSaved = saved?.length || 0
    }
  } catch (error) {
    errors.push(`Saved items migration exception: ${error}`)
  }

  return {
    migratedRatings,
    migratedSaved,
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
  migratedSaved: number
  errors: string[]
}> {
  // This would require setting up a service role client
  // Only use if RLS policies prevent normal migration
  throw new Error(
    'Service role migration not implemented. Use migrateAnonymousData() instead.'
  )
}
