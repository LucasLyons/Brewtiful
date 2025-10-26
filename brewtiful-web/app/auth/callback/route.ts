import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await createClient();
    const { error, data } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      // Check if this is a first-time login by checking if user has any existing ratings
      // (If they have ratings, they've logged in before and migration already happened)
      const { data: existingRatings } = await supabase
        .from('user_ratings')
        .select('beer_id')
        .eq('user_id', data.user.id)
        .limit(1);

      const isFirstLogin = !existingRatings || existingRatings.length === 0;

      // Determine the correct redirect URL based on environment
      let redirectUrl: string;

      // Check if we're in local development
      const isLocalhost = request.headers.get("host")?.includes("localhost");

      if (isLocalhost) {
        // Local development
        const protocol = request.headers.get("x-forwarded-proto") || "http";
        const host = request.headers.get("host");

        if (isFirstLogin) {
          // First login - redirect to migration page
          redirectUrl = `${protocol}://${host}/auth/migrate?next=${encodeURIComponent(next)}`;
        } else {
          // Subsequent login - redirect directly to destination
          redirectUrl = `${protocol}://${host}${next}`;
        }
      } else {
        // Production
        if (isFirstLogin) {
          // First login - redirect to migration page
          redirectUrl = `https://brewtiful.vercel.app/auth/migrate?next=${encodeURIComponent(next)}`;
        } else {
          // Subsequent login - redirect directly to destination
          redirectUrl = `https://brewtiful.vercel.app${next}`;
        }
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
