"use client";

import * as React from "react";
import { Check, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

const PRESET_COLORS = [
  "#CA8A04",
  "#D97706",
  "#B45309",
  "#92400E",
  "#DC2626",
  "#059669",
  "#0284C7",
  "#7C3AED",
  "#1C1917",
  "#78716C",
];

interface ColorPickerProps {
  name?: string;
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  className?: string;
}

function isLightColor(hex: string): boolean {
  if (hex.length < 7) return false;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 150;
}

export function ColorPicker({
  name,
  value,
  defaultValue,
  onChange,
  className,
}: ColorPickerProps) {
  const [internalValue, setInternalValue] = React.useState(
    defaultValue ?? "#000000",
  );
  const isControlled = value !== undefined;
  const currentValue = isControlled ? value : internalValue;
  const nativeRef = React.useRef<HTMLInputElement>(null);

  const handleChange = (next: string) => {
    if (!isControlled) setInternalValue(next);
    onChange?.(next);
  };

  const isPreset = PRESET_COLORS.some(
    (c) => c.toLowerCase() === currentValue.toLowerCase(),
  );

  return (
    <div className={cn("space-y-3", className)}>
      {/* Large color preview — tap to open native picker */}
      <button
        type="button"
        aria-label="Pick color"
        className="group relative h-[4.5rem] w-full cursor-pointer overflow-hidden rounded-[1rem] border border-border shadow-sm transition-all active:scale-[0.98]"
        style={{ backgroundColor: currentValue }}
        onClick={() => nativeRef.current?.click()}
      >
        <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/8 group-active:bg-black/12">
          <span
            className="rounded-full px-3 py-1 text-xs font-semibold tracking-wide opacity-0 shadow-sm backdrop-blur-sm transition-opacity group-hover:opacity-100"
            style={{
              backgroundColor: isLightColor(currentValue)
                ? "rgba(0,0,0,0.55)"
                : "rgba(255,255,255,0.85)",
              color: isLightColor(currentValue) ? "#fff" : "#1C1917",
            }}
          >
            Tap to pick
          </span>
        </div>
      </button>

      <input
        ref={nativeRef}
        type="color"
        className="sr-only"
        value={currentValue}
        onChange={(e) => handleChange(e.target.value)}
        tabIndex={-1}
      />

      {/* Preset swatches */}
      <div className="flex flex-wrap items-center gap-2">
        {PRESET_COLORS.map((color) => {
          const isActive =
            color.toLowerCase() === currentValue.toLowerCase();
          return (
            <button
              key={color}
              type="button"
              aria-label={`Select ${color}`}
              onClick={() => handleChange(color)}
              className={cn(
                "relative size-8 shrink-0 cursor-pointer rounded-full transition-all",
                isActive
                  ? "ring-2 ring-foreground ring-offset-2 ring-offset-surface scale-110"
                  : "border border-black/10 hover:scale-110 hover:shadow-md active:scale-95",
              )}
              style={{ backgroundColor: color }}
            >
              {isActive ? (
                <Check
                  className="absolute inset-0 m-auto size-3.5"
                  style={{
                    color: isLightColor(color)
                      ? "#1C1917"
                      : "#FFFCF7",
                  }}
                  strokeWidth={3}
                />
              ) : null}
            </button>
          );
        })}

        {/* Custom color indicator or add-custom button */}
        {!isPreset ? (
          <button
            type="button"
            aria-label="Edit custom color"
            onClick={() => nativeRef.current?.click()}
            className="relative size-8 shrink-0 cursor-pointer rounded-full ring-2 ring-foreground ring-offset-2 ring-offset-surface scale-110 transition-all"
            style={{ backgroundColor: currentValue }}
          >
            <Check
              className="absolute inset-0 m-auto size-3.5"
              style={{
                color: isLightColor(currentValue)
                  ? "#1C1917"
                  : "#FFFCF7",
              }}
              strokeWidth={3}
            />
          </button>
        ) : (
          <button
            type="button"
            aria-label="Custom color"
            onClick={() => nativeRef.current?.click()}
            className="flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-full border-2 border-dashed border-border bg-surface transition-all hover:border-muted hover:bg-surface-strong active:scale-95"
          >
            <Plus className="size-3.5 text-muted" />
          </button>
        )}
      </div>

      {/* Hex input */}
      <input
        type="text"
        name={name}
        value={currentValue.toUpperCase()}
        onChange={(e) => {
          const v = e.target.value;
          if (/^#[0-9a-fA-F]{0,6}$/.test(v) || v === "#" || v === "") {
            handleChange(v || "#");
          }
        }}
        className="h-10 w-full rounded-[0.75rem] border border-border bg-white/85 px-3 text-xs font-medium uppercase tracking-widest text-muted-strong shadow-[0_1px_0_rgba(255,255,255,0.6)_inset] outline-none transition-colors focus:border-accent"
        placeholder="#000000"
        maxLength={7}
        spellCheck={false}
        autoComplete="off"
      />
    </div>
  );
}
