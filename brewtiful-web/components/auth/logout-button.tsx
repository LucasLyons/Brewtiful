"use client";

import { Button } from "@/components/ui/button";
import { logout } from "@/app/actions/auth";
import { useTransition } from "react";

export function LogoutButton() {
  const [isPending, startTransition] = useTransition();

  const handleLogout = async () => {
    startTransition(async () => {
      await logout();
    });
  };

  return (
    <Button onClick={handleLogout} disabled={isPending} variant="ghost" size="sm">
      {isPending ? "Logging out..." : "Logout"}
    </Button>
  );
}
