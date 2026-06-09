# Milestone Context: v2.0 Operator Power

**Captured:** 2026-06-10  
**Source:** User conversation — all addon suggestions accepted; Stripe/payments explicitly excluded.

## User Goal

Turn Invios from a strong billing console into an **operator power platform**: smarter automation, client intelligence, time-to-invoice, forecasting, proposals, real integrations, AI assistance, and a **named client portal** where each client has a human-readable URL to track all their data.

## Explicit Constraints

| Constraint | Detail |
|------------|--------|
| **No Stripe / no online payments** | User has no Stripe account. `OPS-06`, payment links, and Stripe integration are **out of scope** for this milestone. Billing settings may remain display-only. |
| **Include everything else** | User liked all discussed addons — nothing dropped from planning. |
| **Client portal priority** | Each client gets a **unique URL tied to their name** (human-readable), not only opaque tokens. |
| **GSD workflow** | Full research → requirements → roadmap → per-phase plan/execute/verify. |

## Feature Bundle (Accepted)

1. **AI co-pilot** — paste brief/email → structured quote/invoice; smart reminders; invoice/quote review (TRN, amounts, profitability flags).
2. **Time tracking → auto-billing** — log time, one-click convert to invoice lines using hourly rate.
3. **Client intelligence (mini-CRM)** — LTV, payment reliability, health signals, suggested actions on client detail.
4. **Automation rules engine** — beyond recurring cron: quote accepted → invoice + reminder; conditional rules by amount/client tier.
5. **Cash flow forecasting** — 30/60/90-day projections from analytics + recurring + aging.
6. **Proposals + lightweight approval** — trackable proposals with accept/reject / e-sign-style workflow.
7. **Integrations hub (real)** — webhooks, exports, calendar hooks; not placeholder-only.
8. **Advanced client portal** — branded, name-based URL, full document history and status for the client.

## Additional Items (Also Accepted)

- **AUTO-06** — recurring invoices auto-send on schedule (was deferred).
- **DASH-08** — cohort/custom-range analytics extension (feeds forecasting).
- **EMAIL-07** — auto payment reminder emails (no Stripe dependency).

## Dependency Order (Roadmap)

```
v1.2 Settings (Phases 8–12) ──► must complete first (profile hourly rate, branding, integrations shell)
        │
        ▼
Phase 13 Client Portal v2 ──► named URLs, enhanced UX
        │
        ├──► Phase 14 Client Intelligence (needs portal + payment history)
        ├──► Phase 15 Time Tracking (needs PROF hourly rate from Phase 10)
        │
        ▼
Phase 16 Automation Rules ──► extends Phase 5 cron infrastructure
        │
        ▼
Phase 17 Cash Flow Forecast ──► extends Phase 7 analytics
        │
        ▼
Phase 18 Proposals & Approval ──► extends public quotation flow
        │
        ▼
Phase 19 Integrations Hub ──► replaces Phase 12 placeholder
        │
        ▼
Phase 20 AI Co-pilot ──► benefits from all structured data above
```

## Portal URL Strategy (Decision D-PORT-01)

**Approach:** Add `portal_slug` on `clients` (unique per `user_id`), derived from client name at create/import time, with collision suffix (`acme`, `acme-2`). Public route: `/portal/[portalSlug]` resolving within operator context via slug lookup. **Keep `portal_token`** for backward compatibility; token URLs 301-redirect to slug URL when slug exists. Slug changes update alias table (same pattern as document slugs in v1.0).

**Security:** Slug alone is not secret — acceptable for client portal (like HoneyBook client portals). Optional future: operator can regenerate portal access link. No client enumeration across operators (slug scoped by user_id).

## Out of Scope (This Milestone)

- Stripe, PayPal, native payment collection (`OPS-06`)
- OAuth login (`AUTH-05`) — separate future milestone
- Team/multi-user workspaces
- Full accounting / GL

---
*Approved for roadmap generation — user confirmed all suggestions, no Stripe.*
