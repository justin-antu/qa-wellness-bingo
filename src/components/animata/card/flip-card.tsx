import { cn } from "@/lib/utils";

import "./flip-card.css";

interface FlipCardProps extends React.HTMLAttributes<HTMLDivElement> {
  flipped: boolean;
  front: React.ReactNode;
  back: React.ReactNode;
  frontClassName?: string;
  backClassName?: string;
}

/**
 * Content-based flip card (front/back are arbitrary React nodes, not just an
 * image+caption like Animata's original) - a 180-degree Y-axis flip driven
 * by a `flipped` prop rather than hover, since our use cases (bingo cell
 * toggle, PIN reveal) are click/state driven.
 *
 * Implemented with a small companion CSS file since Tailwind v3 doesn't ship
 * the 3D-transform utilities (`perspective`, `transform-style`,
 * `backface-visibility`) that Animata's v4-targeted version uses.
 */
export default function FlipCard({
  flipped,
  front,
  back,
  frontClassName,
  backClassName,
  className,
  ...props
}: FlipCardProps) {
  return (
    <div className={cn("flip-card-scene", className)} {...props}>
      <div className={cn("flip-card-inner", flipped && "is-flipped")}>
        <div className={cn("flip-card-face", frontClassName)}>{front}</div>
        <div className={cn("flip-card-face flip-card-face-back", backClassName)}>{back}</div>
      </div>
      {/*
       * Flat, non-transformed stand-in for the currently active face, only
       * shown while an ancestor is `.is-capturing`. html-to-image rasterizes
       * via SVG foreignObject, which can't reliably flatten the 3D
       * perspective/rotateY transform above - rather than fight that, we
       * just hide the transformed version and show this plain copy instead.
       */}
      <div className={cn("flip-card-capture-face", flipped ? backClassName : frontClassName)}>
        {flipped ? back : front}
      </div>
    </div>
  );
}
