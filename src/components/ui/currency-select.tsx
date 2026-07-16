"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import { Check, ChevronDown, Search } from "lucide-react";
import {
  CURRENCIES,
  formatCurrencyLabel,
  getCurrency,
  searchCurrencies,
  type CurrencyOption,
} from "@/lib/currencies";
import { cn } from "@/lib/utils";

type CurrencySelectProps = {
  value: string;
  onChange: (code: string) => void;
  id?: string;
  name?: string;
  className?: string;
  options?: CurrencyOption[];
  placeholder?: string;
};

export function CurrencySelect({
  value,
  onChange,
  id,
  name,
  className,
  options = CURRENCIES,
  placeholder = "Select currency",
}: CurrencySelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const selected = useMemo(
    () => getCurrency(value) ?? options.find((c) => c.code === value.toUpperCase()),
    [options, value],
  );

  const filtered = useMemo(() => searchCurrencies(search, options), [options, search]);

  const close = useCallback(() => {
    setOpen(false);
    setSearch("");
  }, []);

  const selectCurrency = useCallback(
    (code: string) => {
      onChange(code);
      close();
      triggerRef.current?.focus();
    },
    [close, onChange],
  );

  const handleClickOutside = useCallback(
    (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        close();
      }
    },
    [close],
  );

  useEffect(() => {
    if (!open) return;
    document.addEventListener("mousedown", handleClickOutside);
    requestAnimationFrame(() => searchRef.current?.focus());
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open, handleClickOutside]);

  useEffect(() => {
    setHighlightedIndex(0);
  }, [search, open]);

  useEffect(() => {
    if (!open) return;
    const el = listRef.current?.querySelector<HTMLElement>(`[data-index="${highlightedIndex}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [highlightedIndex, open]);

  const handleSearchKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setHighlightedIndex((i) => Math.min(i + 1, Math.max(filtered.length - 1, 0)));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlightedIndex((i) => Math.max(i - 1, 0));
    } else if (event.key === "Enter") {
      const option = filtered[highlightedIndex];
      if (option) {
        event.preventDefault();
        selectCurrency(option.code);
      }
    } else if (event.key === "Escape") {
      event.preventDefault();
      close();
      triggerRef.current?.focus();
    }
  };

  const triggerLabel = selected
    ? formatCurrencyLabel(selected)
    : value
      ? value.toUpperCase()
      : placeholder;

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      {name ? <input type="hidden" name={name} value={value} /> : null}
      <button
        ref={triggerRef}
        id={id}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls="currency-listbox"
        onClick={() => (open ? close() : setOpen(true))}
        onKeyDown={(event) => {
          if ((event.key === "ArrowDown" || event.key === "Enter" || event.key === " ") && !open) {
            event.preventDefault();
            setOpen(true);
          }
        }}
        className={cn(
          "flex h-12 w-full items-center justify-between rounded-[var(--radius-inner)] border border-border bg-white/85 px-4 text-left text-sm text-foreground shadow-[0_1px_0_rgba(255,255,255,0.6)_inset] transition-colors hover:border-[#CAB9A2] focus-visible:border-accent focus-visible:outline-none",
          !selected && !value && "text-muted",
        )}
      >
        <span className="flex min-w-0 items-center gap-2 truncate">
          {selected ? (
            <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[#FFF1D6] text-sm">
              {selected.flag}
            </span>
          ) : null}
          <span className="truncate font-medium">{triggerLabel}</span>
        </span>
        <ChevronDown
          className={cn(
            "ml-2 size-4 shrink-0 text-muted transition-transform duration-200",
            open && "rotate-180",
          )}
        />
      </button>

      {open ? (
        <div className="absolute left-0 top-[calc(100%+6px)] z-50 w-full overflow-hidden rounded-[var(--radius-inner)] border border-border bg-white shadow-[0_16px_48px_rgba(19,15,11,0.12)]">
          <div className="border-b border-black/6 p-2">
            <div className="flex items-center gap-2 rounded-[0.6rem] bg-[#FAFAF8] px-3">
              <Search className="size-3.5 shrink-0 text-muted" />
              <input
                ref={searchRef}
                type="text"
                role="searchbox"
                aria-controls="currency-listbox"
                aria-activedescendant={
                  filtered[highlightedIndex]
                    ? `currency-option-${filtered[highlightedIndex].code}`
                    : undefined
                }
                placeholder="Search currency..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                onKeyDown={handleSearchKeyDown}
                className="h-9 w-full bg-transparent text-sm outline-none placeholder:text-muted"
              />
            </div>
          </div>

          <div
            ref={listRef}
            id="currency-listbox"
            role="listbox"
            aria-label="Currencies"
            className="max-h-56 overflow-y-auto p-1.5"
          >
            {filtered.length === 0 ? (
              <p className="px-3 py-4 text-center text-sm text-muted">No currencies found</p>
            ) : (
              filtered.map((option, index) => {
                const isSelected = option.code === value.toUpperCase();
                const isHighlighted = index === highlightedIndex;
                return (
                  <button
                    key={option.code}
                    id={`currency-option-${option.code}`}
                    data-index={index}
                    role="option"
                    aria-selected={isSelected}
                    type="button"
                    onMouseEnter={() => setHighlightedIndex(index)}
                    onClick={() => selectCurrency(option.code)}
                    className={cn(
                      "flex w-full items-center gap-2.5 rounded-[0.6rem] px-3 py-2.5 text-left text-sm transition hover:bg-[#FFF7EA]",
                      isHighlighted && "bg-[#FFF7EA]",
                      isSelected && "bg-[#FFF1D6]",
                    )}
                  >
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[#FFF1D6] text-sm">
                      {option.flag}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-1.5">
                        <span className="font-medium text-foreground">{option.code}</span>
                        <span className="text-muted">· {option.symbol}</span>
                      </span>
                      <span className="block truncate text-xs text-muted">{option.name}</span>
                    </span>
                    {isSelected ? <Check className="size-3.5 shrink-0 text-[#92700C]" /> : null}
                  </button>
                );
              })
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
