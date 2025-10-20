import { Badge } from "@/components/ui/badge";
import { Beer, MapPin } from "lucide-react";

interface BeerListItemProps {
  name: string;
  brewery: string;
  style: string;
  abv?: number;
  location?: string;
  description?: string;
}

export function BeerListItem({
  name,
  brewery,
  style,
  abv,
  location,
  description
}: BeerListItemProps) {
  return (
    <div className="grid grid-cols-6 gap-4 px-4 py-3 hover:bg-muted/50 transition-colors border-b last:border-b-0">
      {/* Name */}
      <div className="col-span-1 flex items-center">
        <span className="font-medium line-clamp-2">{name}</span>
      </div>

      {/* Brewery */}
      <div className="col-span-1 flex items-center gap-1 text-sm text-muted-foreground">
        <Beer className="h-4 w-4 shrink-0" />
        <span className="line-clamp-1">{brewery}</span>
      </div>

      {/* Style */}
      <div className="col-span-1 flex items-center">
        <Badge variant="outline" className="line-clamp-1">{style}</Badge>
      </div>

      {/* ABV */}
      <div className="col-span-1 flex items-center justify-center">
        {abv ? (
          <Badge variant="secondary">{abv}</Badge>
        ) : (
          <span className="text-sm text-muted-foreground">-</span>
        )}
      </div>

      {/* Location */}
      <div className="col-span-1 flex items-center gap-1 text-sm text-muted-foreground">
        {location ? (
          <>
            <MapPin className="h-4 w-4 shrink-0" />
            <span className="line-clamp-1">{location}</span>
          </>
        ) : (
          <span>-</span>
        )}
      </div>

      {/* Description */}
      <div className="col-span-1 flex items-center">
        {description ? (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {description}
          </p>
        ) : (
          <span className="text-sm text-muted-foreground">-</span>
        )}
      </div>
    </div>
  );
}