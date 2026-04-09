import Link from "next/link";
import type { Route } from "next";
import type { ReactNode } from "react";
import type { DataViewConfig } from "./types";

export function ListView<TItem, TStatus extends string>({
  items,
  config,
  emptyState,
}: {
  items: TItem[];
  config: DataViewConfig<TItem, TStatus>;
  emptyState: ReactNode;
}) {
  if (items.length === 0) return <>{emptyState}</>;

  return (
    <div className="grid gap-3">
      {items.map((item) => (
        <Link
          key={config.getId(item)}
          href={config.getHref(item) as Route}
          className="cursor-pointer rounded-[1.25rem] border border-black/5 bg-white px-5 py-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)] transition hover:border-[#D7C4A7] hover:shadow-[0_2px_8px_rgba(0,0,0,0.06)]"
        >
          {config.renderListCard(item)}
        </Link>
      ))}
    </div>
  );
}
