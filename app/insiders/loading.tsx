import { Skeleton } from "@/components/Skeleton";

export default function InsidersLoading() {
  return (
    <main className="flex-1 px-6 py-8 sm:py-10">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-5 border-b border-border pb-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex-1 space-y-3">
            <Skeleton className="h-4 w-24 rounded-md" />
            <Skeleton className="h-9 w-56 rounded-md" />
            <Skeleton className="h-4 w-full max-w-2xl rounded-md" />
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-7 w-16 rounded-full" />
          ))}
        </div>

        <div className="mt-6 space-y-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-14" />
          ))}
        </div>
      </div>
    </main>
  );
}
