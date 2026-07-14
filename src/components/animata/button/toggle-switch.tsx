import { cn } from "@/lib/utils";

interface ToggleSwitchProps {
  checked: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
}

export default function ToggleSwitch({ checked, onChange, disabled }: ToggleSwitchProps) {
  return (
    <label className={cn("inline-flex cursor-pointer select-none items-center", disabled && "opacity-50")}>
      <div className="relative">
        <input
          type="checkbox"
          checked={checked}
          disabled={disabled}
          onChange={(e) => onChange(e.target.checked)}
          className="sr-only"
        />
        <div className={cn("block h-8 w-14 rounded-full transition-colors", checked ? "bg-teal" : "bg-border")} />
        <div
          className={cn(
            "absolute left-1 top-1 h-6 w-6 rounded-full bg-white shadow transition-transform",
            checked && "translate-x-6",
          )}
        />
      </div>
    </label>
  );
}
