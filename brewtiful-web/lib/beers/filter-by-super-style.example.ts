/**
 * Example: Filtering Beers by Super-Style Category
 *
 * This file demonstrates how to use the new super_style column
 * to filter and group beers by their super-categories.
 */

import { createClient } from '@/lib/supabase/server';

/**
 * Get all available super-style categories
 */
export async function getAvailableSuperStyles() {
  const supabase = await createClient();

  const { data: beers } = await supabase
    .from('beers')
    .select('super_style')
    .not('super_style', 'is', null)
    .neq('active', 'Inactive');

  // Get unique super-styles
  const uniqueSuperStyles = [...new Set(beers?.map(b => b.super_style))];

  return uniqueSuperStyles.sort();
}

/**
 * Get beers filtered by super-style
 */
export async function getBeersBySuperStyle(
  superStyle: string,
  limit: number = 24,
  offset: number = 0
) {
  const supabase = await createClient();

  const { data: beers, count } = await supabase
    .from('beers')
    .select(`
      *,
      brewery:breweries (
        brewery_id,
        name,
        city,
        country
      )
    `, { count: 'exact' })
    .eq('super_style', superStyle)
    .neq('active', 'Inactive')
    .order('name')
    .range(offset, offset + limit - 1);

  return { beers, count };
}

/**
 * Get beer counts by super-style for filter UI
 */
export async function getSuperStyleCounts() {
  const supabase = await createClient();

  // This would typically be done with a custom RPC function for better performance
  // For now, we fetch all beers and count client-side
  const { data: beers } = await supabase
    .from('beers')
    .select('super_style')
    .not('super_style', 'is', null)
    .neq('active', 'Inactive');

  const counts: Record<string, number> = {};

  beers?.forEach(beer => {
    if (beer.super_style) {
      counts[beer.super_style] = (counts[beer.super_style] || 0) + 1;
    }
  });

  return counts;
}

/**
 * Search beers within a super-style category
 */
export async function searchBeersInSuperStyle(
  superStyle: string,
  searchQuery: string
) {
  const supabase = await createClient();

  const { data: beers } = await supabase
    .from('beers')
    .select(`
      *,
      brewery:breweries (
        brewery_id,
        name
      )
    `)
    .eq('super_style', superStyle)
    .or(`name.ilike.%${searchQuery}%,brewery.name.ilike.%${searchQuery}%`)
    .neq('active', 'Inactive')
    .limit(20);

  return beers;
}

/**
 * Get super-style distribution for analytics
 */
export async function getSuperStyleDistribution() {
  const supabase = await createClient();

  const { data: beers } = await supabase
    .from('beers')
    .select('super_style')
    .not('super_style', 'is', null);

  const distribution: Record<string, { total: number; active: number }> = {};

  beers?.forEach(beer => {
    if (beer.super_style) {
      if (!distribution[beer.super_style]) {
        distribution[beer.super_style] = { total: 0, active: 0 };
      }
      distribution[beer.super_style].total++;
    }
  });

  return distribution;
}

/**
 * Example Page Component
 *
 * Usage in /app/beers/page.tsx:
 */
/*
export default async function BeersPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { superStyle } = await searchParams;
  const selectedSuperStyle = typeof superStyle === 'string' ? superStyle : undefined;

  // Get available super-styles for filter dropdown
  const availableSuperStyles = await getAvailableSuperStyles();

  // Get beers filtered by super-style
  const { beers, count } = selectedSuperStyle
    ? await getBeersBySuperStyle(selectedSuperStyle)
    : await getAllBeers();

  return (
    <div>
      <select value={selectedSuperStyle} onChange={(e) => {
        // Update URL with selected super-style
        window.location.href = `/beers?superStyle=${e.target.value}`;
      }}>
        <option value="">All Super-Styles</option>
        {availableSuperStyles.map(style => (
          <option key={style} value={style}>{style}</option>
        ))}
      </select>

      <BeersView beers={beers} />

      <p>Showing {beers.length} of {count} beers</p>
    </div>
  );
}
*/

/**
 * Example Filter Component
 */
/*
'use client';

import { useRouter, useSearchParams } from 'next/navigation';

export function SuperStyleFilter({
  availableStyles
}: {
  availableStyles: string[]
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentSuperStyle = searchParams.get('superStyle');

  const handleSuperStyleChange = (superStyle: string) => {
    const params = new URLSearchParams(searchParams);

    if (superStyle) {
      params.set('superStyle', superStyle);
    } else {
      params.delete('superStyle');
    }

    router.push(`/beers?${params.toString()}`);
  };

  return (
    <div>
      <label>Filter by Super-Style</label>
      <select
        value={currentSuperStyle || ''}
        onChange={(e) => handleSuperStyleChange(e.target.value)}
      >
        <option value="">All Categories</option>
        {availableStyles.map(style => (
          <option key={style} value={style}>
            {style}
          </option>
        ))}
      </select>
    </div>
  );
}
*/
