"use client";

import { LayoutGrid, List } from "lucide-react";
import { Button } from "@/components/ui/button";

export type ViewMode = "grid" | "table";

interface ViewToggleProps {
  currentView: ViewMode;
  onViewChange: (view: ViewMode) => void;
}

export function ViewToggle({ currentView, onViewChange }: ViewToggleProps) {
  const handleViewChange = (newView: ViewMode) => {
    localStorage.setItem("beerViewMode", newView);
    onViewChange(newView);
  };

  return (
    <div className="flex items-center gap-1 border rounded-lg p-1">
      <Button
        variant={currentView === "grid" ? "secondary" : "ghost"}
        size="sm"
        onClick={() => handleViewChange("grid")}
        className="gap-2"
      >
        <LayoutGrid className="h-4 w-4" />
        Grid
      </Button>
      <Button
        variant={currentView === "table" ? "secondary" : "ghost"}
        size="sm"
        onClick={() => handleViewChange("table")}
        className="gap-2"
      >
        <List className="h-4 w-4" />
        Table
      </Button>
    </div>
  );
}
