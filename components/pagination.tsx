import Link from "next/link";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function hrefFor(basePath: string, params: Record<string, string>, page: number): string {
  const next = new URLSearchParams(params);
  if (page <= 1) next.delete("page");
  else next.set("page", String(page));
  const query = next.toString();
  return query ? `${basePath}?${query}` : basePath;
}

/**
 * Rendered on the server as plain links, so pages are prefetched on hover
 * and paging works with JavaScript disabled.
 */
export function Pagination({
  basePath,
  params,
  page,
  pageCount,
  total,
  pageSize,
  itemLabel = "results",
}: {
  basePath: string;
  params: Record<string, string>;
  page: number;
  pageCount: number;
  total: number;
  pageSize: number;
  itemLabel?: string;
}) {
  if (total === 0) return null;

  const first = (page - 1) * pageSize + 1;
  const last = Math.min(page * pageSize, total);

  // A short sliding window keeps the control compact on 40-page archives.
  const windowStart = Math.max(1, Math.min(page - 2, pageCount - 4));
  const windowEnd = Math.min(pageCount, Math.max(page + 2, 5));
  const pages: number[] = [];
  for (let index = windowStart; index <= windowEnd; index++) pages.push(index);

  return (
    <nav
      aria-label="Pagination"
      className="text-muted-foreground flex flex-wrap items-center justify-between gap-3 px-1 pt-3 text-sm"
    >
      <p>
        <span className="text-foreground font-medium">
          {first.toLocaleString()}–{last.toLocaleString()}
        </span>{" "}
        of <span className="text-foreground font-medium">{total.toLocaleString()}</span> {itemLabel}
      </p>

      {pageCount > 1 && (
        <div className="flex items-center gap-1">
          <Link
            href={hrefFor(basePath, params, page - 1)}
            aria-disabled={page <= 1}
            tabIndex={page <= 1 ? -1 : undefined}
            className={cn(
              buttonVariants({ variant: "outline", size: "icon-sm" }),
              page <= 1 && "pointer-events-none opacity-50"
            )}
            aria-label="Previous page"
          >
            <ChevronLeftIcon />
          </Link>

          {pages.map((entry) => (
            <Link
              key={entry}
              href={hrefFor(basePath, params, entry)}
              aria-current={entry === page ? "page" : undefined}
              className={cn(
                buttonVariants({
                  variant: entry === page ? "default" : "outline",
                  size: "icon-sm",
                }),
                "tabular-nums"
              )}
            >
              {entry}
            </Link>
          ))}

          <Link
            href={hrefFor(basePath, params, page + 1)}
            aria-disabled={page >= pageCount}
            tabIndex={page >= pageCount ? -1 : undefined}
            className={cn(
              buttonVariants({ variant: "outline", size: "icon-sm" }),
              page >= pageCount && "pointer-events-none opacity-50"
            )}
            aria-label="Next page"
          >
            <ChevronRightIcon />
          </Link>
        </div>
      )}
    </nav>
  );
}
