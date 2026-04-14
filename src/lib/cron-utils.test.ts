import { describe, it, expect } from "vitest";
import {
  advanceNextDueDate,
  shouldSendReminder,
} from "@/lib/cron-utils";

// ─── advanceNextDueDate ───────────────────────────────────────────────────────

describe("advanceNextDueDate", () => {
  it("advances weekly by 7 days", () => {
    expect(advanceNextDueDate("2026-04-12", "weekly")).toBe("2026-04-19");
  });

  it("advances monthly by 1 month", () => {
    expect(advanceNextDueDate("2026-04-12", "monthly")).toBe("2026-05-12");
  });

  it("advances quarterly by 3 months", () => {
    expect(advanceNextDueDate("2026-04-12", "quarterly")).toBe("2026-07-12");
  });

  it("handles month-end rollover for monthly (Jan 31 → Feb overflows to Mar)", () => {
    // JS Date: Jan 31 + 1 month → Feb 31 → rolls to Mar 3 (or Mar 2 in leap year)
    const result = advanceNextDueDate("2026-01-31", "monthly");
    // Accept JS native behavior (Feb 31 overflows to Mar 3 in non-leap year)
    expect(result).toBe("2026-03-03");
  });

  it("advances quarterly from end of year", () => {
    expect(advanceNextDueDate("2026-10-01", "quarterly")).toBe("2027-01-01");
  });

  it("advances weekly across month boundary", () => {
    expect(advanceNextDueDate("2026-04-28", "weekly")).toBe("2026-05-05");
  });
});

// ─── shouldSendReminder ───────────────────────────────────────────────────────

describe("shouldSendReminder", () => {
  const base = {
    reminderDaysBefore: 3,
    reminderDaysAfter: 7,
    remindOnDueDate: true,
    secondReminderDays: 14,
  };

  it("returns 'before' when days-before match", () => {
    const result = shouldSendReminder({
      ...base,
      dueDate: "2026-04-15",
      today: "2026-04-12",
    });
    expect(result).toBe("before");
  });

  it("returns 'due_date' on the due date", () => {
    const result = shouldSendReminder({
      ...base,
      dueDate: "2026-04-12",
      today: "2026-04-12",
    });
    expect(result).toBe("due_date");
  });

  it("returns 'after' when days-past-due match", () => {
    const result = shouldSendReminder({
      ...base,
      dueDate: "2026-04-05",
      today: "2026-04-12",
    });
    expect(result).toBe("after");
  });

  it("returns 'second' when second reminder days match", () => {
    const result = shouldSendReminder({
      ...base,
      dueDate: "2026-03-29",
      today: "2026-04-12",
    });
    expect(result).toBe("second");
  });

  it("returns null when no rule matches (too early)", () => {
    // 8 days before due, reminderDaysBefore is 3 — no match
    const result = shouldSendReminder({
      ...base,
      dueDate: "2026-04-20",
      today: "2026-04-12",
    });
    expect(result).toBeNull();
  });

  it("returns null when remindOnDueDate is false on the due date", () => {
    const result = shouldSendReminder({
      ...base,
      remindOnDueDate: false,
      dueDate: "2026-04-12",
      today: "2026-04-12",
    });
    expect(result).toBeNull();
  });

  it("returns null when days-past-due does not match any rule (e.g., 5 days past)", () => {
    // reminderDaysAfter=7, secondReminderDays=14 — 5 days past matches neither
    const result = shouldSendReminder({
      ...base,
      dueDate: "2026-04-07",
      today: "2026-04-12",
    });
    expect(result).toBeNull();
  });

  it("returns null for a far-future due date (well beyond reminderDaysBefore)", () => {
    const result = shouldSendReminder({
      ...base,
      dueDate: "2026-06-01",
      today: "2026-04-12",
    });
    expect(result).toBeNull();
  });

  it("returns 'before' with custom reminderDaysBefore=7", () => {
    const result = shouldSendReminder({
      ...base,
      reminderDaysBefore: 7,
      dueDate: "2026-04-19",
      today: "2026-04-12",
    });
    expect(result).toBe("before");
  });

  it("returns 'after' with custom reminderDaysAfter=3", () => {
    const result = shouldSendReminder({
      ...base,
      reminderDaysAfter: 3,
      dueDate: "2026-04-09",
      today: "2026-04-12",
    });
    expect(result).toBe("after");
  });
});
