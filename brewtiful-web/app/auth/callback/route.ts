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
      // Determine the correct redirect URL based on environment
      const isLocalhost = request.headers.get("host")?.includes("localhost");

      let redirectUrl: string;

      if (isLocalhost) {
        // Local development
        const protocol = request.headers.get("x-forwarded-proto") || "http";
        const host = request.headers.get("host");
        redirectUrl = `${protocol}://${host}${next}`;
      } else {
        // Production
        redirectUrl = `https://brewtiful.vercel.app${next}`;
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
