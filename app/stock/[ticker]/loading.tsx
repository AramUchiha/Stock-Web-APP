import { Skeleton } from "@/components/Skeleton";

export default function StockLoading() {
  return (
    <main className="flex-1 px-5 py-8 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-5xl">
        <Skeleton className="h-4 w-36 rounded-md" />

        <div className="mt-5 flex flex-col gap-5 border-b border-border pb-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex-1 space-y-3">
            <Skeleton className="h-6 w-24 rounded-md" />
            <Skeleton className="h-9 w-64 rounded-md" />
            <Skeleton className="h-4 w-40 rounded-md" />
          </div>
          <Skeleton className="h-16 w-40 rounded-md" />
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-14 rounded-md" />
          ))}
        </div>

        <Skeleton className="mt-8 h-[320px] sm:h-[420px]" />

        <div className="mt-10 space-y-3">
          <Skeleton className="h-4 w-32 rounded-md" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>

        <div className="mt-10 space-y-3">
          <Skeleton className="h-4 w-32 rounded-md" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
      </div>
    </main>
  );
}
