interface ListSkeletonProps {
  rows?: number;
}

export default function ListSkeleton({ rows = 5 }: ListSkeletonProps) {
  return (
    <div className="flex w-full flex-col gap-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={`skeleton-row-${i}`} className="flex w-full animate-pulse items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-teal-light" />
          <div className="h-3 flex-1 rounded-md bg-teal-light" />
          <div className="h-3 w-10 rounded-md bg-teal-light" />
        </div>
      ))}
    </div>
  );
}
