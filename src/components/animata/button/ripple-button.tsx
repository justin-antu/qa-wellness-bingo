import { useCallback, useRef, useState } from "react";

import { cn } from "@/lib/utils";

import "./ripple-button.css";

interface RippleButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

export default function RippleButton({ children, className, ...props }: RippleButtonProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const rippleRef = useRef<HTMLSpanElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  const createRipple = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      if (isHovered || !buttonRef.current || !rippleRef.current) return;
      setIsHovered(true);

      const button = buttonRef.current;
      const ripple = rippleRef.current;
      const rect = button.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height) * 2;
      const x = event.clientX - rect.left - size / 2;
      const y = event.clientY - rect.top - size / 2;

      ripple.style.width = `${size}px`;
      ripple.style.height = `${size}px`;
      ripple.style.left = `${x}px`;
      ripple.style.top = `${y}px`;

      ripple.classList.remove("ripple-leave");
      ripple.classList.add("ripple-enter");
    },
    [isHovered],
  );

  const removeRipple = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    if (event.target !== event.currentTarget) return;
    if (!buttonRef.current || !rippleRef.current) return;
    setIsHovered(false);

    const button = buttonRef.current;
    const ripple = rippleRef.current;
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height) * 2;
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;

    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;

    ripple.classList.remove("ripple-enter");
    ripple.classList.add("ripple-leave");

    const handleAnimationEnd = () => {
      if (ripple) {
        ripple.classList.remove("ripple-leave");
        ripple.removeEventListener("animationend", handleAnimationEnd);
      }
    };

    ripple.addEventListener("animationend", handleAnimationEnd);
  }, []);

  const handleMouseMove = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      if (!buttonRef.current || !rippleRef.current || !isHovered) return;

      const button = buttonRef.current;
      const ripple = rippleRef.current;
      const rect = button.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height) * 2;
      const x = event.clientX - rect.left - size / 2;
      const y = event.clientY - rect.top - size / 2;

      ripple.style.left = `${x}px`;
      ripple.style.top = `${y}px`;
    },
    [isHovered],
  );

  return (
    <button
      ref={buttonRef}
      className={cn(
        "font-kalam relative flex items-center justify-center overflow-hidden rounded-full bg-teal px-6 py-3 text-base font-bold text-white transition-colors duration-300 hover:bg-teal-dark disabled:cursor-default disabled:opacity-60",
        className,
      )}
      onMouseEnter={(e) => {
        if (e.target === e.currentTarget) {
          createRipple(e);
        }
      }}
      onMouseLeave={(e) => {
        if (e.target === e.currentTarget) {
          removeRipple(e);
        }
      }}
      onMouseMove={handleMouseMove}
      {...props}
    >
      <span className="relative z-[2]">{children}</span>
      <span ref={rippleRef} className="ripple" />
    </button>
  );
}
