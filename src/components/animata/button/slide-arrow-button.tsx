import { ArrowRight } from "lucide-react";
import type React from "react";

import { cn } from "@/lib/utils";

interface SlideArrowButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  text?: string;
  primaryColor?: string;
}

export default function SlideArrowButton({
  text = "Get Started",
  primaryColor = "var(--teal)",
  className,
  ...props
}: SlideArrowButtonProps) {
  return (
    <button
      className={cn(
        "group/slide relative rounded-full border-2 border-teal bg-white p-2 text-base font-bold",
        className,
      )}
      {...props}
    >
      <div
        className="absolute left-0 top-0 flex h-full w-11 items-center justify-end rounded-full transition-all duration-200 ease-in-out group-hover/slide:w-full"
        style={{ backgroundColor: primaryColor }}
      >
        <span className="mr-3 text-white transition-all duration-200 ease-in-out">
          <ArrowRight size={20} />
        </span>
      </div>
      <span className="relative left-4 z-10 whitespace-nowrap px-8 font-bold text-ink transition-all duration-200 ease-in-out group-hover/slide:-left-3 group-hover/slide:text-white">
        {text}
      </span>
    </button>
  );
}
