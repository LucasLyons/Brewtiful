'use server';

import { createClient } from '@/lib/supabase/server';

export async function toggleFlag(
  beerId: number,
  flagAsActive: boolean // true = flag as active, false = flag as inactive
): Promise<{
  success: boolean;
  userFlagged: boolean | null; // null = removed flag, true = flagged active, false = flagged inactive
  activeCounts: { active: number; inactive: number } | null;
}> {
  try {
    const supabase = await createClient();

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, userFlagged: null, activeCounts: null };
    }

    // Check if user already has a flag for this beer
    const { data: existingFlag } = await supabase
      .from('active_inactive_flags')
      .select('flag')
      .eq('beer_id', beerId)
      .eq('user_id', user.id)
      .maybeSingle();

    let newFlagState: boolean | null = null;

    if (existingFlag) {
      // User already has a flag
      if (existingFlag.flag === flagAsActive) {
        // Clicking same button - remove flag
        const { error: deleteError } = await supabase
          .from('active_inactive_flags')
          .delete()
          .eq('beer_id', beerId)
          .eq('user_id', user.id);

        if (deleteError) {
          console.error('Error deleting flag:', deleteError);
          return { success: false, userFlagged: null, activeCounts: null };
        }
        newFlagState = null;
      } else {
        // Clicking opposite button - update flag
        const { error: updateError } = await supabase
          .from('active_inactive_flags')
          .update({ flag: flagAsActive })
          .eq('beer_id', beerId)
          .eq('user_id', user.id);

        if (updateError) {
          console.error('Error updating flag:', updateError);
          return { success: false, userFlagged: null, activeCounts: null };
        }
        newFlagState = flagAsActive;
      }
    } else {
      // User doesn't have a flag - insert new one
      const { error: insertError } = await supabase
        .from('active_inactive_flags')
        .insert({ beer_id: beerId, user_id: user.id, flag: flagAsActive });

      if (insertError) {
        console.error('Error inserting flag:', insertError);
        return { success: false, userFlagged: null, activeCounts: null };
      }
      newFlagState = flagAsActive;
    }

    // Get updated counts
    const { data: flags } = await supabase
      .from('active_inactive_flags')
      .select('flag')
      .eq('beer_id', beerId);

    const activeCount = flags?.filter(f => f.flag === true).length || 0;
    const inactiveCount = flags?.filter(f => f.flag === false).length || 0;

    return {
      success: true,
      userFlagged: newFlagState,
      activeCounts: { active: activeCount, inactive: inactiveCount }
    };
  } catch (error) {
    console.error('Error in toggleFlag:', error);
    return { success: false, userFlagged: null, activeCounts: null };
  }
}
