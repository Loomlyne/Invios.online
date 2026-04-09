"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface ColorPickerProps {
  name?: string;
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  className?: string;
}

export function ColorPicker({
  name,
  value,
  defaultValue,
  onChange,
  className,
}: ColorPickerProps) {
  const [internalValue, setInternalValue] = React.useState(defaultValue ?? "#000000");
  const isControlled = value !== undefined;
  const currentValue = isControlled ? value : internalValue;
  const nativeRef = React.useRef<HTMLInputElement>(null);

  const handleChange = (next: string) => {
    if (!isControlled) setInternalValue(next);
    onChange?.(next);
  };

  return (
    <div
      className={cn(
        "flex h-12 items-center gap-3 rounded-[1rem] border border-border bg-white/85 px-3 shadow-[0_1px_0_rgba(255,255,255,0.6)_inset] transition-colors focus-within:border-accent",
        className,
      )}
    >
      <button
        type="button"
        aria-label="Pick color"
        className="size-7 shrink-0 cursor-pointer rounded-full border border-black/10 shadow-sm transition-transform hover:scale-110 active:scale-95"
        style={{ backgroundColor: currentValue }}
        onClick={() => nativeRef.current?.click()}
      />
      <input
        ref={nativeRef}
        type="color"
        className="sr-only"
        value={currentValue}
        onChange={(e) => handleChange(e.target.value)}
        tabIndex={-1}
      />
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
        className="w-full bg-transparent text-sm font-medium uppercase tracking-wide text-foreground outline-none placeholder:text-muted"
        placeholder="#000000"
        maxLength={7}
        spellCheck={false}
        autoComplete="off"
      />
    </div>
  );
}
