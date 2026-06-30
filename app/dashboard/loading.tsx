import { Skeleton } from "@/components/Skeleton";

export default function DashboardLoading() {
  return (
    <main className="flex-1 px-5 py-8 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-5 border-b border-border pb-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex-1 space-y-3">
            <Skeleton className="h-4 w-32 rounded-md" />
            <Skeleton className="h-9 w-48 rounded-md" />
            <Skeleton className="h-4 w-full max-w-2xl rounded-md" />
            <Skeleton className="h-10 w-full max-w-md rounded-lg" />
          </div>
        </div>

        <div className="mt-8 grid gap-10 lg:grid-cols-2">
          {Array.from({ length: 2 }).map((_, columnIndex) => (
            <div key={columnIndex} className="space-y-4">
              <Skeleton className="h-4 w-32 rounded-md" />
              <div className="grid gap-4 sm:grid-cols-2">
                {Array.from({ length: 4 }).map((_, cardIndex) => (
                  <Skeleton key={cardIndex} className="h-32" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
