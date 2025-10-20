"use client";

import { useRef, useState, useEffect } from "react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { MapPin, Building2 } from "lucide-react";

interface BreweryListItemProps {
  name: string;
  country?: string;
  provinceOrState?: string;
  city?: string;
}

function TruncatedText({
  children,
  className,
  as: Component = "span"
}: {
  children: string;
  className?: string;
  as?: "div" | "span" | "p";
}) {
  const ref = useRef<HTMLDivElement & HTMLSpanElement & HTMLParagraphElement>(null);
  const [isTruncated, setIsTruncated] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (element) {
      setIsTruncated(element.scrollHeight > element.clientHeight || element.scrollWidth > element.clientWidth);
    }
  }, [children]);

  if (isTruncated) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Component ref={ref} className={`${className} cursor-help`}>
            {children}
          </Component>
        </TooltipTrigger>
        <TooltipContent>
          <p className="max-w-xs">{children}</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  return <Component ref={ref} className={className}>{children}</Component>;
}

export function BreweryListItem({
  name,
  country,
  provinceOrState,
  city
}: BreweryListItemProps) {
  return (
    <TooltipProvider>
      <div className="grid grid-cols-12 gap-4 px-4 py-3 hover:bg-muted/50 transition-colors border-b last:border-b-0">
        {/* Name */}
        <div className="col-span-3 flex items-center min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <Building2 className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="font-medium line-clamp-2">{name}</span>
          </div>
        </div>

        {/* Country */}
        <div className="col-span-3 flex items-center gap-1 text-sm text-muted-foreground min-w-0">
          {country ? (
            <>
              <MapPin className="h-4 w-4 shrink-0" />
              <TruncatedText className="line-clamp-1">{country}</TruncatedText>
            </>
          ) : (
            <span>-</span>
          )}
        </div>

        {/* Province/State */}
        <div className="col-span-3 flex items-center text-sm text-muted-foreground min-w-0">
          {provinceOrState ? (
            <TruncatedText className="line-clamp-1">{provinceOrState}</TruncatedText>
          ) : (
            <span>-</span>
          )}
        </div>

        {/* City */}
        <div className="col-span-3 flex items-center text-sm text-muted-foreground min-w-0">
          {city ? (
            <TruncatedText className="line-clamp-1">{city}</TruncatedText>
          ) : (
            <span>-</span>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}
