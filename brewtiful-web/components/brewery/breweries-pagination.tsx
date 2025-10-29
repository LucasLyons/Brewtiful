'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

interface BreweriesPaginationProps {
  currentPage: number;
  totalPages: number;
}

export function BreweriesPagination({ currentPage, totalPages }: BreweriesPaginationProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const createPageURL = (pageNumber: number) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', pageNumber.toString());
    return `${pathname}?${params.toString()}`;
  };

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 7; // 1, ..., current-1, current, current+1, ..., end

    if (totalPages <= maxVisible) {
      // Show all pages if total is small
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);

      // Calculate the range around current page
      const showLeftEllipsis = currentPage > 3;
      const showRightEllipsis = currentPage < totalPages - 2;

      if (showLeftEllipsis) {
        pages.push('...');
      }

      // Show current-1, current, current+1 (but avoid duplicating first/last page)
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (showRightEllipsis) {
        pages.push('...');
      }

      // Always show last page (if not already shown)
      if (totalPages > 1) {
        pages.push(totalPages);
      }
    }

    return pages;
  };

  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className="mt-8 flex items-center justify-center gap-2">
      {/* First page */}
      <Button
        variant="outline"
        size="icon"
        asChild
        disabled={currentPage === 1}
      >
        <Link href={createPageURL(1)} aria-label="First page">
          <ChevronsLeft className="h-4 w-4" />
        </Link>
      </Button>

      {/* Previous page */}
      <Button
        variant="outline"
        size="icon"
        asChild
        disabled={currentPage === 1}
      >
        <Link href={createPageURL(currentPage - 1)} aria-label="Previous page">
          <ChevronLeft className="h-4 w-4" />
        </Link>
      </Button>

      {/* Page numbers */}
      <div className="flex items-center gap-1">
        {getPageNumbers().map((page, index) => {
          if (page === '...') {
            return (
              <span key={`ellipsis-${index}`} className="px-2">
                ...
              </span>
            );
          }

          return (
            <Button
              key={page}
              variant={currentPage === page ? 'default' : 'outline'}
              size="icon"
              asChild
            >
              <Link href={createPageURL(page as number)}>
                {page}
              </Link>
            </Button>
          );
        })}
      </div>

      {/* Next page */}
      <Button
        variant="outline"
        size="icon"
        asChild
        disabled={currentPage === totalPages}
      >
        <Link href={createPageURL(currentPage + 1)} aria-label="Next page">
          <ChevronRight className="h-4 w-4" />
        </Link>
      </Button>

      {/* Last page */}
      <Button
        variant="outline"
        size="icon"
        asChild
        disabled={currentPage === totalPages}
      >
        <Link href={createPageURL(totalPages)} aria-label="Last page">
          <ChevronsRight className="h-4 w-4" />
        </Link>
      </Button>
    </div>
  );
}
