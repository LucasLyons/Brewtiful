import Link from "next/link";
import { User } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { LogoutButton } from "@/components/auth/logout-button";
import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";
import { Button } from "@/components/ui/button";

export async function AuthButton() {
  const supabase = await createClient();

  const { data } = await supabase.auth.getClaims();
  const user = data?.claims;

  return user && !user.is_anonymous ? (
    <div className="flex items-center gap-1 sm:gap-2">
      <span className="hidden md:inline text-sm text-muted-foreground">Hey, {user.email}!</span>
      <Button variant="ghost" size="sm" asChild>
        <Link href="/profile" className="flex items-center gap-1 sm:gap-2">
          <User className="h-4 w-4" />
          <span className="hidden sm:inline">Profile</span>
        </Link>
      </Button>
      <LogoutButton />
    </div>
  ) : (
    <GoogleSignInButton />
  );
}
