# Phase 5: Automation & Recovery - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-12
**Phase:** 05-automation-recovery
**Areas discussed:** Version snapshot trigger, Restore safety boundary, Recurring billing model, Reminder scope in v1

---

## Version Snapshot Trigger

| Option | Description | Selected |
|--------|-------------|----------|
| Every save | Capture a snapshot each time the user saves the invoice | ✓ |
| Status transitions only | Capture only when invoice moves between statuses | |
| Manual checkpoint | User clicks 'Save version' to create a named snapshot | |

**User's choice:** Every save (Recommended)
**Notes:** Simple and predictable.

---

## Version History UI Location

| Option | Description | Selected |
|--------|-------------|----------|
| Collapsible sidebar panel | Panel on right of invoice detail | ✓ |
| Separate tab in invoice detail | 'History' tab | |
| Modal via menu action | Accessible via '...' menu | |

**User's choice:** Collapsible sidebar panel
**Notes:** Doesn't disrupt main invoice view.

---

## Version Retention Limit

| Option | Description | Selected |
|--------|-------------|----------|
| Last 10 versions | Rolling window, oldest dropped at 11 | ✓ |
| Last 25 versions | More history | |
| Unlimited | Keep all forever | |

**User's choice:** 10 versions for now
**Notes:** "for now keep it 10 but when i upgrade to make the app premium and with subscription then it will be unlimited" — unlimited retention is a future premium tier feature.

---

## Restore Safety Boundary

| Option | Description | Selected |
|--------|-------------|----------|
| Warn + confirm, then restore | Show total change, require confirmation | ✓ |
| Block restore if payments exist | Prevent restore entirely when payments recorded | |
| Restore silently | No warning, immediate restore | |

**User's choice:** Warn + confirm (Recommended)
**Notes:** Payments and expenses are preserved. Invoice fields revert. Payment status recalculates.

---

## Recurring Billing — Entry Points

| Option | Description | Selected |
|--------|-------------|----------|
| On existing invoice only | 'Make recurring' action on detail | |
| During invoice creation only | Toggle in builder | |
| Both creation + existing | Available in both places | ✓ |

**User's choice:** Both
**Notes:** User also raised the idea of recurring expenses (monthly hosting, annual domain) — noted as deferred.

---

## Recurring Invoice — What Gets Created

| Option | Description | Selected |
|--------|-------------|----------|
| New draft invoice | Fresh draft, user reviews and sends | ✓ |
| Ready-to-send copy | Invoice created in 'sent' state | |

**User's choice:** New draft invoice (Recommended)
**Notes:** Keeps Phase 5 clear of auto-send scope (AUTO-06 is v2).

---

## Recurring Billing — Generation Trigger

| Option | Description | Selected |
|--------|-------------|----------|
| Vercel cron job | Daily cron creates overdue drafts automatically | ✓ |
| On-demand generation | User manually triggers 'Generate next cycle' | |

**User's choice:** Vercel cron (Recommended)

---

## Reminder Scope

| Option | Description | Selected |
|--------|-------------|----------|
| Manual 'Send Reminder' button with dedup guard | User-driven, rate-limited | |
| Automated via Vercel cron | Cron sends on schedule from settings rules | ✓ |

**User's choice:** Automated global sends via cron
**Notes:** User pointed out reminder settings are already built in Settings > Notifications. Reminders should be global and automatic — "not on any invoice page but working globally."

---

## Reminder Timing Configuration

| Option | Description | Selected |
|--------|-------------|----------|
| Per-invoice cooldown only | Global setting: min days between reminders | ✓ |
| Rule-based: before due + after overdue | Rules as suggestions, manual trigger | |

**User's choice:** Per-invoice cooldown (existing settings already cover this)

---

## Reminder Email Content

| Option | Description | Selected |
|--------|-------------|----------|
| Invoice link + amount due + due date | Compact, standard | ✓ |
| Full invoice summary in email | Line items, totals, instructions | |

**User's choice:** Invoice link + amount due + due date

---

## Claude's Discretion

- Cron API route naming and auth (`CRON_SECRET` pattern)
- SQL schema details for new tables
- Version sidebar component structure
- Whether to add a "Recurring" badge to the invoices list

## Deferred Ideas

- Recurring payments/expenses — future phase
- Unlimited version history — future premium subscription tier
- AUTO-06 auto-send recurring invoices — v2
- Per-invoice reminder button — decided against
