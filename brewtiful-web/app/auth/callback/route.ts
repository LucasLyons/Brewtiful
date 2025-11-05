import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Check if account is marked for deletion and restore if necessary
      const { data: { user } } = await supabase.auth.getUser();
      let wasRestored = false;

      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('marked_for_deletion')
          .eq('id', user.id)
          .single();

        if (profile?.marked_for_deletion) {
          await supabase
            .from('profiles')
            .update({ marked_for_deletion: false })
            .eq('id', user.id);
          wasRestored = true;
        }
      }
      // Determine the correct redirect URL based on environment
      const isLocalhost = request.headers.get("host")?.includes("localhost");

      let redirectUrl: string;

      if (isLocalhost) {
        // Local development
        const protocol = request.headers.get("x-forwarded-proto") || "http";
        const host = request.headers.get("host");
        const baseUrl = `${protocol}://${host}${next}`;
        redirectUrl = wasRestored ? `${baseUrl}${next.includes('?') ? '&' : '?'}restored=true` : baseUrl;
      } else {
        // Production
        const baseUrl = `https://brewtiful.vercel.app${next}`;
        redirectUrl = wasRestored ? `${baseUrl}${next.includes('?') ? '&' : '?'}restored=true` : baseUrl;
      }

      return NextResponse.redirect(redirectUrl);
    }
  }

  // Return the user to an error page with some instructions
  // Use the request host to construct error URL
  const isLocalhost = request.headers.get("host")?.includes("localhost");
  const protocol = isLocalhost ? "http" : "https";
  const host = request.headers.get("host");

  return NextResponse.redirect(`${protocol}://${host}/auth/error?error=Unable to authenticate`);
}
