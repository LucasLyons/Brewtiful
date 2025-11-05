'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { CheckCircle2, X } from 'lucide-react'

export function AccountRestoredMessage() {
  const searchParams = useSearchParams()
  const [show, setShow] = useState(false)

  useEffect(() => {
    const restored = searchParams.get('restored')
    if (restored === 'true') {
      setShow(true)

      // Remove the query param from the URL
      const params = new URLSearchParams(searchParams.toString())
      params.delete('restored')
      const newUrl = params.toString()
        ? `${window.location.pathname}?${params.toString()}`
        : window.location.pathname

      window.history.replaceState({}, '', newUrl)
    }
  }, [searchParams])

  const handleDismiss = () => {
    setShow(false)
  }

  if (!show) return null

  return (
    <div className="fixed top-4 right-4 z-50 max-w-md animate-in slide-in-from-top-2 fade-in">
      <div className="rounded-lg border border-green-200 bg-green-50 p-4 shadow-lg dark:border-green-800 dark:bg-green-950">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold text-green-900 dark:text-green-100">
              Account Restored
            </h3>
            <p className="mt-1 text-sm text-green-800 dark:text-green-200">
              Welcome back! Your account has been successfully restored and will not be deleted.
            </p>
          </div>
          <button
            onClick={handleDismiss}
            className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-200"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
