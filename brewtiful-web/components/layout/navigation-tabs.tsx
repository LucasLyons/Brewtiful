"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, BookOpen, Building2, Sparkles } from "lucide-react";

export function NavigationTabs() {
  const pathname = usePathname();

  const tabs = [
    {
      name: "Home",
      href: "/",
      icon: Home,
    },
    {
      name: "Catalog",
      href: "/beers",
      icon: BookOpen,
    },
    {
      name: "Breweries",
      href: "/breweries",
      icon: Building2,
    },
    {
      name: "Recommendations",
      href: "/recommendations",
      icon: Sparkles,
    },
  ];

  return (
    <div className="flex items-center gap-1">
      {tabs.map((tab) => {
        const isActive = pathname === tab.href ||
          (tab.href !== "/" && pathname.startsWith(tab.href));
        const Icon = tab.icon;

        return (
          <Link
            key={tab.name}
            href={tab.href}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium
              transition-all duration-200
              ${
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              }
            `}
          >
            <Icon className="h-4 w-4" />
            <span>{tab.name}</span>
          </Link>
        );
      })}
    </div>
  );
}
