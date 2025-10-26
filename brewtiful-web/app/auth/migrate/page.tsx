'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { backupClientId, getClientId } from '@/components/providers/client-id-provider'
import { migrateUserData } from '@/app/actions/migrate'

/**
 * Migration page that handles the "upgrade" flow when a user logs in for the first time.
 *
 * Flow:
 * 1. OAuth callback redirects here with 'first_login=true'
 * 2. Client-side: Backup the current anonymous client_id
 * 3. Server-side: Migrate anonymous data to the authenticated user
 * 4. Redirect to the intended destination
 *
 * On subsequent logins, OAuth callback redirects directly to destination (skips this page).
 */
export default function MigratePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<'migrating' | 'error' | 'complete'>('migrating')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const migrate = async () => {
      try {
        // Get the current client_id before backing it up
        const clientId = getClientId()
        if (!clientId) {
          throw new Error('No client_id found')
        }

        // Backup the client_id for logout restoration
        backupClientId()

        // Migrate anonymous data to authenticated user via Server Action
        const result = await migrateUserData(clientId)

        if (!result.success) {
          throw new Error(result.error || 'Migration failed')
        }

        // Log migration results
        console.log('Migration complete:', {
          ratings: result.migratedRatings,
          savedBeers: result.migratedSavedBeers,
          savedBreweries: result.migratedSavedBreweries,
        })

        setStatus('complete')

        // Redirect to the intended destination
        const next = searchParams.get('next') || '/'
        setTimeout(() => {
          router.push(next)
        }, 500)
      } catch (err) {
        console.error('Migration failed:', err)
        setError(err instanceof Error ? err.message : 'Unknown error')
        setStatus('error')
      }
    }

    migrate()
  }, [router, searchParams])

  if (status === 'migrating') {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 text-lg font-semibold">Setting up your account...</div>
          <div className="text-sm text-muted-foreground">
            Migrating your ratings and saved items
          </div>
        </div>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 text-lg font-semibold text-destructive">
            Migration Error
          </div>
          <div className="text-sm text-muted-foreground">{error}</div>
          <button
            onClick={() => router.push('/')}
            className="mt-4 rounded-md bg-primary px-4 py-2 text-primary-foreground"
          >
            Continue to Home
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <div className="mb-4 text-lg font-semibold">Account setup complete!</div>
        <div className="text-sm text-muted-foreground">Redirecting...</div>
      </div>
    </div>
  )
}
