"use client";

import { Button } from "@/components/ui/button";
import { logout } from "@/app/actions/auth";
import { restoreClientId } from "@/components/providers/client-id-provider";
import { useTransition } from "react";

export function LogoutButton() {
  const [isPending, startTransition] = useTransition();

  const handleLogout = async () => {
    startTransition(async () => {
      // First, logout from Supabase
      await logout();

      // After successful logout, restore the anonymous client_id
      // This will reload the page to the home screen with the old anonymous session
      restoreClientId();

      // If there's no backup to restore, the page will still show logged out state
    });
  };

  return (
    <Button onClick={handleLogout} disabled={isPending}>
      {isPending ? "Logging out..." : "Logout"}
    </Button>
  );
}
