'use client'

import { createContext, useContext, useEffect, useState } from 'react'

const ClientIdContext = createContext<string | null>(null)

const CLIENT_ID_KEY = 'brewtiful_client_id'
const BACKUP_CLIENT_ID_KEY = 'brewtiful_backup_client_id'

/**
 * Generates a simple UUID v4 without external dependencies
 */
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

/**
 * Backs up the current client_id before upgrading to authenticated user.
 * This allows restoring the anonymous session after logout.
 */
export function backupClientId(): void {
  if (typeof window === 'undefined') return

  const currentId = localStorage.getItem(CLIENT_ID_KEY)
  if (currentId) {
    localStorage.setItem(BACKUP_CLIENT_ID_KEY, currentId)
  }
}

/**
 * Restores the backed up client_id after logout.
 * Returns the session to the previous anonymous state.
 *
 * @param shouldReload - If true, triggers a page reload after restoration (default: true)
 * @returns true if a backup was restored, false otherwise
 */
export function restoreClientId(shouldReload: boolean = true): boolean {
  if (typeof window === 'undefined') return false

  const backupId = localStorage.getItem(BACKUP_CLIENT_ID_KEY)
  if (backupId) {
    localStorage.setItem(CLIENT_ID_KEY, backupId)
    localStorage.removeItem(BACKUP_CLIENT_ID_KEY)

    // Trigger a page reload to ensure all components use the restored client_id
    if (shouldReload) {
      window.location.reload()
    }

    return true
  }

  return false
}

/**
 * Gets the current client_id from localStorage (server-safe).
 * Returns null if running on server or not yet initialized.
 */
export function getClientId(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(CLIENT_ID_KEY)
}

/**
 * Provider component that manages a persistent client ID for anonymous user tracking.
 *
 * The client ID is stored in localStorage and persists across sessions.
 * This allows anonymous users to maintain their ratings and interactions
 * before they create an account.
 *
 * When a user signs in, their anonymous data (identified by client_id) can be
 * migrated to their authenticated user account via backupClientId().
 *
 * When a user logs out, their anonymous session can be restored via restoreClientId().
 */
export function ClientIdProvider({ children }: { children: React.ReactNode }) {
  const [clientId, setClientId] = useState<string | null>(null)

  useEffect(() => {
    // Check if client_id exists in localStorage
    let id = localStorage.getItem(CLIENT_ID_KEY)

    if (!id) {
      // Generate new client_id
      id = generateUUID()
      localStorage.setItem(CLIENT_ID_KEY, id)
    }

    setClientId(id)
  }, [])

  return (
    <ClientIdContext.Provider value={clientId}>
      {children}
    </ClientIdContext.Provider>
  )
}

/**
 * Hook to access the current client ID.
 *
 * @returns The client ID string, or null if not yet initialized
 * @throws Error if used outside of ClientIdProvider
 *
 * @example
 * ```tsx
 * function RatingComponent() {
 *   const clientId = useClientId()
 *
 *   const handleRate = async (rating: number) => {
 *     if (!clientId) return // Wait for initialization
 *
 *     await supabase.from('user_ratings').insert({
 *       beer_id: beerId,
 *       rating,
 *       client_id: clientId,
 *       user_id: user?.id || null
 *     })
 *   }
 * }
 * ```
 */
export function useClientId() {
  const context = useContext(ClientIdContext)
  if (context === undefined) {
    throw new Error('useClientId must be used within ClientIdProvider')
  }
  return context
}
