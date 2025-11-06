"use client";

import { useState, useEffect } from "react";
import { BeerFiltersSidebar } from "./beer-filters-sidebar";

interface BeersPageLayoutProps {
  availableBreweries: string[];
  availableStyles: string[];
  availableLocations: string[];
  availableCities: string[];
  children: React.ReactNode;
}

export function BeersPageLayout({
  availableBreweries,
  availableStyles,
  availableLocations,
  availableCities,
  children,
}: BeersPageLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Load sidebar state from localStorage
  useEffect(() => {
    const savedState = localStorage.getItem("filtersSidebarOpen");
    if (savedState !== null) {
      setIsSidebarOpen(savedState === "true");
    }
  }, []);

  // Save sidebar state to localStorage
  const handleToggleSidebar = () => {
    const newState = !isSidebarOpen;
    setIsSidebarOpen(newState);
    localStorage.setItem("filtersSidebarOpen", String(newState));
  };

  return (
    <>
      <BeerFiltersSidebar
        availableBreweries={availableBreweries}
        availableStyles={availableStyles}
        availableLocations={availableLocations}
        availableCities={availableCities}
        isOpen={isSidebarOpen}
        onToggle={handleToggleSidebar}
      />
      <div
        className={`py-4 sm:py-6 lg:py-8 px-3 sm:px-4 transition-all duration-300 ${
          isSidebarOpen ? "lg:pl-72 lg:pr-4" : ""
        }`}
      >
        <div className="container mx-auto">{children}</div>
      </div>
    </>
  );
}
