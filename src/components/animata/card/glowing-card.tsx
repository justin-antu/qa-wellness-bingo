import type React from "react";

import { cn } from "@/lib/utils";

interface GlowCardProps extends React.HTMLAttributes<HTMLDivElement> {
  fromColor?: string;
  viaColor?: string;
  toColor?: string;
}

export default function GlowingCard({
  fromColor = "#5f9ea0",
  viaColor = "#f5c451",
  toColor = "#5f9ea0",
  className,
  children,
  ...props
}: GlowCardProps) {
  const gradient = `linear-gradient(to right, ${fromColor}, ${viaColor}, ${toColor})`;

  return (
    <div
      className={cn("rounded-2xl p-0.5 shadow-glow transition-all duration-500 ease-in-out", className)}
      style={{ backgroundImage: gradient }}
      {...props}
    >
      <div className="relative overflow-hidden rounded-[calc(1rem-2px)] bg-white">{children}</div>
    </div>
  );
}
