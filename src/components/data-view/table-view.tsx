"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import type { Route } from "next";
import { ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { KeyboardEvent, MouseEvent, ReactNode } from "react";
import type { DataViewConfig } from "./types";

// Interactive elements inside a row should handle their own click/keyboard
// behavior instead of triggering row navigation.
const INTERACTIVE_SELECTOR = "a, button, input, select, textarea, [role='button']";

export function TableView<TItem, TStatus extends string>({
  items,
  config,
  emptyState,
}: {
  items: TItem[];
  config: DataViewConfig<TItem, TStatus>;
  emptyState: ReactNode;
}) {
  const router = useRouter();
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  function handleSort(key: string) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  const sortedItems = useMemo(() => {
    const arr = [...items];
    if (sortKey) {
      const col = config.tableColumns.find((c) => c.key === sortKey);
      if (col?.compare) {
        arr.sort((a, b) =>
          sortDir === "asc" ? col.compare!(a, b) : col.compare!(b, a),
        );
      }
    }
    return arr;
  }, [items, sortKey, sortDir, config.tableColumns]);

  return (
    <div className="overflow-x-auto rounded-[var(--radius-card)] border border-black/7">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-surface-subtle">
            {config.tableColumns.map((col) => (
              <th
                key={col.key}
                className={cn(
                  "px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted whitespace-nowrap",
                  col.sortable && "cursor-pointer select-none hover:text-foreground",
                  col.className,
                )}
                onClick={() => col.sortable && handleSort(col.key)}
              >
                <div className="flex items-center gap-1">
                  {col.label}
                  {col.sortable && (
                    <span className="text-muted/60">
                      {sortKey === col.key ? (
                        sortDir === "asc" ? (
                          <ChevronUp className="size-3" />
                        ) : (
                          <ChevronDown className="size-3" />
                        )
                      ) : (
                        <ChevronsUpDown className="size-3" />
                      )}
                    </span>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sortedItems.length === 0 ? (
            <tr>
              <td
                colSpan={config.tableColumns.length}
                className="bg-surface px-4 py-8"
              >
                {emptyState}
              </td>
            </tr>
          ) : (
            sortedItems.map((item) => (
              <tr
                key={config.getId(item)}
                onClick={(e: MouseEvent<HTMLTableRowElement>) => {
                  const target = e.target as HTMLElement;
                  if (target.closest(INTERACTIVE_SELECTOR)) return;
                  router.push(config.getHref(item) as Route);
                }}
                onKeyDown={(e: KeyboardEvent<HTMLTableRowElement>) => {
                  if (e.key !== "Enter" && e.key !== " ") return;
                  const target = e.target as HTMLElement;
                  if (target.closest(INTERACTIVE_SELECTOR)) return;
                  e.preventDefault();
                  router.push(config.getHref(item) as Route);
                }}
                tabIndex={0}
                role="link"
                className="cursor-pointer border-t border-black/5 bg-surface transition hover:bg-surface-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/45 focus-visible:ring-offset-2 focus-visible:ring-offset-[#FFFCF7]"
              >
                {config.tableColumns.map((col) => (
                  <td
                    key={col.key}
                    className={cn("px-4 py-3", col.className)}
                  >
                    {col.render(item)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
