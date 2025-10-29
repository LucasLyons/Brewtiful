'use client';

import { useState } from 'react';
import { Flag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toggleFlag } from '@/lib/beers/toggle-flag';

interface FlagButtonsProps {
  beerId: number;
  initialFlagActive: number;
  initialFlagInactive: number;
  userFlaggedActive: boolean | null; // null = not flagged, true = flagged active, false = flagged inactive
  isAuthenticated: boolean;
}

export function FlagButtons({
  beerId,
  initialFlagActive,
  initialFlagInactive,
  userFlaggedActive,
  isAuthenticated,
}: FlagButtonsProps) {
  const [flagActiveCount, setFlagActiveCount] = useState(initialFlagActive);
  const [flagInactiveCount, setFlagInactiveCount] = useState(initialFlagInactive);
  const [userFlag, setUserFlag] = useState<boolean | null>(userFlaggedActive);
  const [isLoading, setIsLoading] = useState(false);

  const handleFlagActive = async () => {
    if (isLoading || !isAuthenticated) return;

    setIsLoading(true);

    const result = await toggleFlag(beerId, true);

    if (result.success && result.activeCounts) {
      setUserFlag(result.userFlagged);
      setFlagActiveCount(result.activeCounts.active);
      setFlagInactiveCount(result.activeCounts.inactive);
    } else {
      console.error('Failed to toggle flag');
    }

    setIsLoading(false);
  };

  const handleFlagInactive = async () => {
    if (isLoading || !isAuthenticated) return;

    setIsLoading(true);

    const result = await toggleFlag(beerId, false);

    if (result.success && result.activeCounts) {
      setUserFlag(result.userFlagged);
      setFlagActiveCount(result.activeCounts.active);
      setFlagInactiveCount(result.activeCounts.inactive);
    } else {
      console.error('Failed to toggle flag');
    }

    setIsLoading(false);
  };

  const activeFlagged = userFlag === true;
  const inactiveFlagged = userFlag === false;

  return (
    <div className="flex gap-2 flex-wrap">
      <Button
        onClick={handleFlagActive}
        disabled={isLoading || !isAuthenticated}
        variant="outline"
        size="sm"
        className={`${
          activeFlagged
            ? 'border-green-600 bg-green-600 text-white hover:bg-green-700 dark:border-green-600 dark:bg-green-600 dark:hover:bg-green-700'
            : 'border-green-600 text-green-600 bg-transparent hover:bg-green-50 dark:border-green-500 dark:text-green-500 dark:hover:bg-green-950'
        } ${!isAuthenticated ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <Flag className="h-4 w-4 mr-2" />
        Flag Active ({flagActiveCount})
      </Button>

      <Button
        onClick={handleFlagInactive}
        disabled={isLoading || !isAuthenticated}
        variant="outline"
        size="sm"
        className={`${
          inactiveFlagged
            ? 'border-red-600 bg-red-600 text-white hover:bg-red-700 dark:border-red-600 dark:bg-red-600 dark:hover:bg-red-700'
            : 'border-red-600 text-red-600 bg-transparent hover:bg-red-50 dark:border-red-500 dark:text-red-500 dark:hover:bg-red-950'
        } ${!isAuthenticated ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <Flag className="h-4 w-4 mr-2" />
        Flag Inactive ({flagInactiveCount})
      </Button>
    </div>
  );
}
