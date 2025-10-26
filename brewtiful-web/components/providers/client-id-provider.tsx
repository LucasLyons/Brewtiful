'use client'

import { createContext, useContext, useEffect, useState } from 'react'

const ClientIdContext = createContext<string | null>(null)

const CLIENT_ID_KEY = 'brewtiful_client_id'

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
 * Provider component that manages a persistent client ID for anonymous user tracking.
 *
 * The client ID is stored in localStorage and persists across sessions.
 * This allows anonymous users to maintain their ratings and interactions
 * before they create an account.
 *
 * When a user signs in, their anonymous data (identified by client_id) can be
 * migrated to their authenticated user account.
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
