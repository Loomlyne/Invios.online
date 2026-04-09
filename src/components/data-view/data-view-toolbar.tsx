"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import type { Route } from "next";
import { Select } from "@/components/ui/select";
import { ViewSwitcher } from "./view-switcher";
import type { StatusOption, ViewMode } from "./types";

export function DataViewToolbar({
  searchPlaceholder,
  statusOptions,
  currentSearch,
  currentStatus,
  currentView,
  extraParams,
}: {
  searchPlaceholder: string;
  statusOptions: StatusOption[];
  currentSearch: string;
  currentStatus: string;
  currentView: ViewMode;
  extraParams?: Record<string, string>;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(currentSearch);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);

  const navigate = useCallback(
    (overrides: { search?: string; status?: string }) => {
      const params = new URLSearchParams(searchParams.toString());
      if (extraParams) {
        for (const [k, v] of Object.entries(extraParams)) params.set(k, v);
      }
      params.set("view", currentView);

      const s = overrides.search ?? search;
      if (s) params.set("search", s);
      else params.delete("search");

      if (overrides.status !== undefined) params.set("status", overrides.status);

      router.push(`${pathname}?${params.toString()}` as Route, { scroll: false });
    },
    [searchParams, extraParams, currentView, search, pathname, router],
  );

  function handleSearchChange(value: string) {
    setSearch(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => navigate({ search: value }), 300);
  }

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  function handleViewChange(view: ViewMode) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("view", view);
    router.push(`${pathname}?${params.toString()}` as Route, { scroll: false });
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
        <input
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          placeholder={searchPlaceholder}
          className="h-11 flex-1 rounded-[1rem] border border-border bg-white px-4 text-sm"
        />
        <div className="sm:w-56">
          <Select
            options={statusOptions}
            value={currentStatus}
            onChange={(value) => navigate({ status: value })}
            placeholder="All statuses"
          />
        </div>
      </div>
      <ViewSwitcher value={currentView} onChange={handleViewChange} />
    </div>
  );
}
