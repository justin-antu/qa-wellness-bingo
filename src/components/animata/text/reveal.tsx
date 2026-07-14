import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

interface RevealProps extends React.HTMLAttributes<HTMLDivElement> {
  delayMs?: number;
}

/**
 * A small, self-contained "blur + slide up" entrance, in the spirit of
 * Animata's text-reveal presets - their actual Text category ships a
 * shared multi-hundred-line animation runtime, which is overkill for a
 * couple of one-shot headline reveals here.
 */
export default function Reveal({ children, className, delayMs = 0, ...props }: RevealProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), delayMs);
    return () => clearTimeout(timer);
  }, [delayMs]);

  return (
    <div
      className={cn(
        "transition-all duration-700 ease-out",
        visible ? "translate-y-0 opacity-100 blur-0" : "translate-y-3 opacity-0 blur-sm",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
