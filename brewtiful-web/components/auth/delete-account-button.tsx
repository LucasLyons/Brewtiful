'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { markAccountForDeletion } from '@/app/profile/actions'
import { Trash2 } from 'lucide-react'

export function DeleteAccountButton() {
  const router = useRouter()
  const [clickCount, setClickCount] = useState(0)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  const handleClick = async () => {
    if (isDeleting) return

    if (clickCount === 0) {
      setClickCount(1)
      // Reset after 3 seconds
      setTimeout(() => setClickCount(0), 3000)
    } else {
      // Second click - proceed with deletion
      setIsDeleting(true)
      const result = await markAccountForDeletion()

      if (result.success) {
        setShowSuccess(true)
        // Redirect to home after showing message
        setTimeout(() => {
          router.push('/')
          router.refresh()
        }, 4000)
      } else {
        setIsDeleting(false)
        setClickCount(0)
        alert(result.error || 'Failed to delete account')
      }
    }
  }

  if (showSuccess) {
    return (
      <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-950">
        <h3 className="font-semibold text-green-900 dark:text-green-100">
          Account Marked for Deletion
        </h3>
        <p className="mt-2 text-sm text-green-800 dark:text-green-200">
          Your account will be automatically deleted by the end of the day. If
          you change your mind, simply log in again to restore your account.
        </p>
        <p className="mt-2 text-sm text-green-700 dark:text-green-300">
          Redirecting to home page...
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <Button
        variant="destructive"
        size="sm"
        onClick={handleClick}
        disabled={isDeleting}
        className="w-full sm:w-auto"
      >
        <Trash2 className="mr-2 h-4 w-4" />
        {clickCount === 0
          ? 'Delete Account'
          : isDeleting
            ? 'Deleting...'
            : 'Click Again to Confirm'}
      </Button>
      {clickCount === 1 && (
        <p className="text-xs text-muted-foreground">
          Click again within 3 seconds to confirm deletion
        </p>
      )}
    </div>
  )
}
