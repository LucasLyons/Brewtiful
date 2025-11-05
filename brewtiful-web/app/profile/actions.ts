'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function markAccountForDeletion() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  const { error } = await supabase
    .from('profiles')
    .update({ marked_for_deletion: true })
    .eq('id', user.id)

  if (error) {
    console.error('Error marking account for deletion:', error)
    return { error: 'Failed to mark account for deletion' }
  }

  // Sign out the user
  await supabase.auth.signOut()

  revalidatePath('/', 'layout')

  return { success: true }
}

export async function restoreMarkedAccount() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  // Check if account is marked for deletion
  const { data: profile } = await supabase
    .from('profiles')
    .select('marked_for_deletion')
    .eq('id', user.id)
    .single()

  if (profile?.marked_for_deletion) {
    const { error } = await supabase
      .from('profiles')
      .update({ marked_for_deletion: false })
      .eq('id', user.id)

    if (error) {
      console.error('Error restoring account:', error)
      return { error: 'Failed to restore account' }
    }

    return { restored: true }
  }

  return { restored: false }
}
