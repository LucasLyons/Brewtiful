"use client";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export function LogoutButton() {
  const router = useRouter();

  const logout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.refresh(); // Refresh the page to update auth state
    router.push("/"); // Redirect to home page
  };

  return <Button onClick={logout}>Logout</Button>;
}
