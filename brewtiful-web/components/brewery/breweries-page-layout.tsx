"use client";

import { useState, useEffect } from "react";
import { BreweryFiltersSidebar } from "./brewery-filters-sidebar";

interface BreweriesPageLayoutProps {
  availableCountries: string[];
  availableCities: string[];
  availableProvinceOrStates: string[];
  children: React.ReactNode;
}

export function BreweriesPageLayout({
  availableCountries,
  availableCities,
  availableProvinceOrStates,
  children,
}: BreweriesPageLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isClient, setIsClient] = useState(false);

  // Mark when component has mounted on client
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Load sidebar state from localStorage
  useEffect(() => {
    if (!isClient) return;

    const savedState = localStorage.getItem("breweryFiltersSidebarOpen");
    if (savedState !== null) {
      setIsSidebarOpen(savedState === "true");
    }
  }, [isClient]);

  // Save sidebar state to localStorage
  const handleToggleSidebar = () => {
    const newState = !isSidebarOpen;
    setIsSidebarOpen(newState);
    localStorage.setItem("breweryFiltersSidebarOpen", String(newState));
  };

  return (
    <>
      <BreweryFiltersSidebar
        availableCountries={availableCountries}
        availableCities={availableCities}
        availableProvinceOrStates={availableProvinceOrStates}
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
