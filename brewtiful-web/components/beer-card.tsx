import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Beer, MapPin, Star } from "lucide-react";

interface BeerCardProps {
  name: string;
  brewery: string;
  style: string;
  abv?: number;
  location?: string;
  description?: string;
}

export function BeerCard({ 
  name, 
  brewery, 
  style, 
  abv, 
  location,
  description 
}: BeerCardProps) {
  return (
    <Card className="flex flex-col h-full hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-xl line-clamp-2">{name}</CardTitle>
          <Badge variant="secondary" className="shrink-0">
            {abv}
          </Badge>
        </div>
        <CardDescription className="flex items-center gap-1">
          <Beer className="h-4 w-4" />
          {brewery}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="flex-1">
        <div className="space-y-3">
          <Badge variant="outline">{style}</Badge>
          
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            </div>
          </div>

          {location && (
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" />
              {location}
            </div>
          )}

          {description && (
            <p className="text-sm text-muted-foreground line-clamp-3">
              {description}
            </p>
          )}
        </div>
      </CardContent>

      <CardFooter>
        <button className="w-full text-sm font-medium hover:underline">
          View Details →
        </button>
      </CardFooter>
    </Card>
  );
}