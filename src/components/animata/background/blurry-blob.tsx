import { cn } from "@/lib/utils";

interface BlobProps extends React.HTMLAttributes<HTMLDivElement> {
  firstBlobColor?: string;
  secondBlobColor?: string;
}

export default function BlurryBlob({
  className,
  firstBlobColor = "bg-teal-light",
  secondBlobColor = "bg-teal",
}: BlobProps) {
  return (
    <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden" aria-hidden>
      <div
        className={cn(
          "absolute -right-16 -top-20 h-64 w-64 animate-pop-blob rounded-full opacity-40 mix-blend-multiply blur-3xl filter",
          firstBlobColor,
          className,
        )}
      />
      <div
        className={cn(
          "absolute -left-20 -top-10 h-64 w-64 animate-pop-blob rounded-full opacity-30 mix-blend-multiply blur-3xl filter",
          secondBlobColor,
          className,
        )}
        style={{ animationDelay: "1.5s" }}
      />
    </div>
  );
}
