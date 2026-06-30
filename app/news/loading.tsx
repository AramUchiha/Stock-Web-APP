import { Skeleton } from "@/components/Skeleton";

export default function NewsLoading() {
  return (
    <main className="flex-1 px-5 py-8 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-col gap-5 pb-7 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex-1 space-y-3">
            <Skeleton className="h-10 w-48 rounded-md" />
            <Skeleton className="h-4 w-full max-w-2xl rounded-md" />
          </div>
        </div>

        <div className="flex gap-2 border-b border-border pb-4">
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} className="h-4 w-16 rounded-md" />
          ))}
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-7 w-16 rounded-full" />
          ))}
        </div>

        <div className="mt-7 space-y-5">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-28" />
          ))}
        </div>
      </div>
    </main>
  );
}
