import { Skeleton } from "@/components/ui/skeleton";

/**
 * Shown by every screen while its data is loading, so a click always paints
 * something before the server responds — no generic shape needs to match any
 * one page exactly, it just needs to appear immediately and avoid a jarring
 * layout jump.
 */
export function PageSkeleton() {
  return (
    <>
      <header className="bg-card flex shrink-0 items-center justify-between gap-3 border-b px-3 py-2.5 sm:px-6 sm:py-3">
        <div className="min-w-0 space-y-2">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="hidden h-4 w-64 sm:block" />
        </div>
        <Skeleton className="size-9 shrink-0 rounded-full" />
      </header>

      <main className="animate-in fade-in-0 flex-1 overflow-y-auto p-3 duration-300 sm:p-5 lg:p-6">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 xl:grid-cols-8">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>

        <div className="mt-4 grid gap-4 xl:grid-cols-3">
          <Skeleton className="h-72 rounded-xl xl:col-span-2" />
          <Skeleton className="h-72 rounded-xl" />
        </div>
      </main>
    </>
  );
}
