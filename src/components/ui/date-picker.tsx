"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";

const DAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

function startOfMonth(year: number, month: number) {
  return new Date(year, month, 1);
}

function daysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function formatDisplay(iso: string) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

function toIso(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function isSameDay(iso: string, year: number, month: number, day: number) {
  return iso === toIso(year, month, day);
}

export function DatePicker({
  value,
  onChange,
  id,
  name,
  align = "left",
  compact = false,
}: {
  value: string;
  onChange: (iso: string) => void;
  id?: string;
  name?: string;
  align?: "left" | "right";
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const panelWidth = 280;
  const panelHeightEstimate = 320;

  // Parse current value to set initial view month
  const parsed = value ? new Date(value + "T00:00:00") : new Date();
  const [viewYear, setViewYear] = useState(parsed.getFullYear());
  const [viewMonth, setViewMonth] = useState(parsed.getMonth());

  const today = new Date();
  const todayIso = toIso(today.getFullYear(), today.getMonth(), today.getDate());

  const handleClickOutside = useCallback((event: MouseEvent) => {
    const target = event.target as Node;
    if (triggerRef.current?.contains(target) || panelRef.current?.contains(target)) {
      return;
    }
    setOpen(false);
  }, []);

  useEffect(() => {
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      // Sync view to current value when opening
      const d = value ? new Date(value + "T00:00:00") : new Date();
      setViewYear(d.getFullYear());
      setViewMonth(d.getMonth());
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open, handleClickOutside, value]);

  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [open]);

  function openCalendar() {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const openAbove = spaceBelow < panelHeightEstimate && rect.top > panelHeightEstimate;
      const preferredLeft = align === "right" ? rect.right - panelWidth : rect.left;
      const left = Math.min(
        Math.max(12, preferredLeft),
        Math.max(12, window.innerWidth - panelWidth - 12),
      );

      setPosition({
        top: openAbove ? Math.max(12, rect.top - panelHeightEstimate - 6) : rect.bottom + 6,
        left,
      });
    }

    setOpen(true);
  }

  function prevMonth() {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  }

  function nextMonth() {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  }

  function selectDay(day: number) {
    onChange(toIso(viewYear, viewMonth, day));
    setOpen(false);
  }

  // Build calendar grid
  const firstDay = startOfMonth(viewYear, viewMonth);
  // Monday=0, Sunday=6
  let startWeekday = firstDay.getDay() - 1;
  if (startWeekday < 0) startWeekday = 6;
  const totalDays = daysInMonth(viewYear, viewMonth);
  const prevMonthDays = daysInMonth(
    viewMonth === 0 ? viewYear - 1 : viewYear,
    viewMonth === 0 ? 11 : viewMonth - 1,
  );

  const cells: { day: number; current: boolean }[] = [];
  // Leading days from previous month
  for (let i = startWeekday - 1; i >= 0; i--) {
    cells.push({ day: prevMonthDays - i, current: false });
  }
  // Current month days
  for (let d = 1; d <= totalDays; d++) {
    cells.push({ day: d, current: true });
  }
  // Trailing days to fill the grid
  const remaining = 7 - (cells.length % 7);
  if (remaining < 7) {
    for (let d = 1; d <= remaining; d++) {
      cells.push({ day: d, current: false });
    }
  }

  const monthName = new Date(viewYear, viewMonth).toLocaleDateString("en-US", { month: "long" });

  const panel = open ? (
    <div
      ref={panelRef}
      style={{
        position: "fixed",
        top: position.top,
        left: position.left,
        width: panelWidth,
      }}
      className="z-[9999] rounded-[1rem] border border-border bg-white p-3 shadow-[0_16px_48px_rgba(19,15,11,0.12)]"
    >
      {/* Header */}
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-semibold text-foreground">
          {monthName} {viewYear}
        </span>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={prevMonth}
            className="flex size-8 items-center justify-center rounded-full text-muted transition hover:bg-[#FFF7EA] hover:text-foreground"
            aria-label="Previous month"
          >
            <ChevronLeft className="size-4" />
          </button>
          <button
            type="button"
            onClick={nextMonth}
            className="flex size-8 items-center justify-center rounded-full text-muted transition hover:bg-[#FFF7EA] hover:text-foreground"
            aria-label="Next month"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>

      {/* Weekday headers */}
      <div className="mb-1 grid grid-cols-7">
        {DAYS.map((d) => (
          <div key={d} className="flex h-8 items-center justify-center text-xs font-medium text-muted">
            {d}
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7">
        {cells.map((cell, i) => {
          const isSelected = cell.current && isSameDay(value, viewYear, viewMonth, cell.day);
          const isToday = cell.current && isSameDay(todayIso, viewYear, viewMonth, cell.day);

          return (
            <button
              key={i}
              type="button"
              disabled={!cell.current}
              onClick={() => cell.current && selectDay(cell.day)}
              className={`flex size-9 items-center justify-center rounded-full text-sm transition ${
                isSelected
                  ? "bg-foreground font-semibold text-on-dark"
                  : isToday
                    ? "font-semibold text-[#92700C] ring-1 ring-inset ring-[#CA8A04]/30"
                    : cell.current
                      ? "text-foreground hover:bg-[#FFF7EA]"
                      : "text-black/20"
              }`}
            >
              {cell.day}
            </button>
          );
        })}
      </div>

      {/* Footer */}
      <div className="mt-2 flex items-center justify-between border-t border-black/6 pt-2">
        <button
          type="button"
          onClick={() => {
            onChange("");
            setOpen(false);
          }}
          className="rounded-full px-3 py-1 text-xs font-medium text-muted transition hover:bg-[#FFF7EA] hover:text-foreground"
        >
          Clear
        </button>
        <button
          type="button"
          onClick={() => {
            onChange(todayIso);
            setOpen(false);
          }}
          className="rounded-full px-3 py-1 text-xs font-medium text-[#92700C] transition hover:bg-[#FFF7EA]"
        >
          Today
        </button>
      </div>
    </div>
  ) : null;

  return (
    <div>
      {name ? <input type="hidden" name={name} value={value} /> : null}
      <button
        ref={triggerRef}
        type="button"
        id={id}
        onClick={() => (open ? setOpen(false) : openCalendar())}
        className={`flex w-full items-center justify-between border border-border bg-white/85 text-left text-sm text-foreground shadow-[0_1px_0_rgba(255,255,255,0.6)_inset] transition hover:border-[#CAB9A2] ${compact ? "h-9 rounded-[0.75rem] px-3 gap-2" : "h-12 rounded-[1rem] px-4"}`}
      >
        <span className={compact ? "text-xs" : ""}>{formatDisplay(value) || "Select date"}</span>
        <Calendar className={compact ? "size-3.5 text-muted" : "size-4 text-muted"} />
      </button>
      {typeof document !== "undefined" ? createPortal(panel, document.body) : panel}
    </div>
  );
}
