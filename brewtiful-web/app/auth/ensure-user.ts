import { createClient } from '@/utils/supabase/server';

export async function ensureUser() {
    const supabase = await createClient();

    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
        supabase.auth.signInAnonymously()
    }
}