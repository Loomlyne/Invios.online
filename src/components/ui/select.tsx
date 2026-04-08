"use client";

import * as React from "react";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  options: SelectOption[];
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  name?: string;
  id?: string;
  className?: string;
  placeholder?: string;
}

export function Select({
  options,
  value,
  defaultValue,
  onChange,
  name,
  id,
  className,
  placeholder,
}: SelectProps) {
  const [open, setOpen] = React.useState(false);
  const [internalValue, setInternalValue] = React.useState(defaultValue ?? "");
  const [focusedIndex, setFocusedIndex] = React.useState(-1);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const triggerRef = React.useRef<HTMLButtonElement>(null);

  const isControlled = value !== undefined;
  const currentValue = isControlled ? value : internalValue;
  const selectedOption = options.find((o) => o.value === currentValue);

  // Close on click outside
  React.useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const select = (val: string) => {
    if (!isControlled) setInternalValue(val);
    onChange?.(val);
    setOpen(false);
    triggerRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open) {
      if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        setOpen(true);
        setFocusedIndex(options.findIndex((o) => o.value === currentValue));
      }
      return;
    }

    switch (e.key) {
      case "Escape":
        e.preventDefault();
        setOpen(false);
        triggerRef.current?.focus();
        break;
      case "ArrowDown":
        e.preventDefault();
        setFocusedIndex((i) => Math.min(i + 1, options.length - 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setFocusedIndex((i) => Math.max(i - 1, 0));
        break;
      case "Enter":
      case " ":
        e.preventDefault();
        if (focusedIndex >= 0 && focusedIndex < options.length) {
          select(options[focusedIndex].value);
        }
        break;
    }
  };

  return (
    <div ref={containerRef} className="relative" onKeyDown={handleKeyDown}>
      {name ? <input type="hidden" name={name} value={currentValue} /> : null}
      <button
        ref={triggerRef}
        type="button"
        id={id}
        role="combobox"
        aria-expanded={open}
        aria-haspopup="listbox"
        onClick={() => {
          setOpen(!open);
          if (!open) setFocusedIndex(options.findIndex((o) => o.value === currentValue));
        }}
        className={cn(
          "flex h-12 w-full items-center justify-between rounded-[1rem] border border-border bg-white/85 px-4 text-sm text-foreground shadow-[0_1px_0_rgba(255,255,255,0.6)_inset] transition-colors focus-visible:border-accent focus-visible:outline-none",
          !selectedOption && "text-muted",
          className,
        )}
      >
        <span className="truncate">{selectedOption?.label ?? placeholder ?? "Select\u2026"}</span>
        <ChevronDown
          className={cn(
            "ml-2 size-4 shrink-0 text-muted transition-transform duration-200",
            open && "rotate-180",
          )}
        />
      </button>
      {open ? (
        <div
          role="listbox"
          className="absolute z-50 mt-2 w-full animate-in fade-in slide-in-from-top-1 rounded-[1rem] border border-border bg-white p-1.5 shadow-[var(--shadow-md)]"
        >
          {options.map((option, i) => (
            <button
              key={option.value}
              type="button"
              role="option"
              aria-selected={option.value === currentValue}
              onClick={() => select(option.value)}
              className={cn(
                "flex w-full items-center justify-between rounded-[0.7rem] px-3.5 py-2.5 text-sm transition-colors",
                option.value === currentValue
                  ? "bg-foreground font-medium text-on-dark"
                  : "text-foreground hover:bg-surface-strong",
                i === focusedIndex && option.value !== currentValue && "bg-surface-strong",
              )}
            >
              <span>{option.label}</span>
              {option.value === currentValue ? <Check className="size-3.5" /> : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
