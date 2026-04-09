"use client";

import { LayoutList, Columns3, Table2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ViewMode } from "./types";

const views: { mode: ViewMode; Icon: React.ElementType; label: string }[] = [
  { mode: "list", Icon: LayoutList, label: "List view" },
  { mode: "kanban", Icon: Columns3, label: "Kanban view" },
  { mode: "table", Icon: Table2, label: "Table view" },
];

export function ViewSwitcher({
  value,
  onChange,
}: {
  value: ViewMode;
  onChange: (v: ViewMode) => void;
}) {
  return (
    <div className="inline-flex items-center rounded-[1.2rem] border border-border bg-[#FFF9F0] p-1 gap-0.5">
      {views.map(({ mode, Icon, label }) => (
        <button
          key={mode}
          type="button"
          aria-label={label}
          onClick={() => onChange(mode)}
          className={cn(
            "inline-flex size-9 items-center justify-center rounded-full transition",
            value === mode
              ? "bg-foreground text-background"
              : "text-muted hover:text-foreground",
          )}
        >
          <Icon className="size-4" />
        </button>
      ))}
    </div>
  );
}
