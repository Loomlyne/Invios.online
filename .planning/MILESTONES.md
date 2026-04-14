# Milestones

## v1.0 MVP (Shipped: 2026-04-14)

**Delivered:** Full billing lifecycle shipped — from onboarding and branded document creation through payment tracking, public share, version history, recurring billing, and reminder automation, live on invios.online.

**Phases completed:** 5 phases (1–5), 28 plans, 55 tasks

**Stats:**
- ~22,900 lines TypeScript
- 168 commits
- 9 days (2026-04-05 → 2026-04-14)
- Git range: initial commit → `feat: full site brand color theming via HSL-derived CSS token family`

**Key accomplishments:**
- **Phase 1:** Installable app shell, onboarding wizard with live branded preview, mobile-first navigation, auth middleware, and Settings persistence
- **Phase 2:** Full document engine — client management, quotation/invoice builders with live preview, ShareModal, DocumentStatusActions, PDF export, and quotation-to-invoice conversion
- **Phase 3:** Financial operator console — payments + expenses tracking, auto invoice status computation, profit/margin per invoice, MetricCard dashboard with collection rate and overdue visibility
- **Phase 4:** Public trust surfaces — public invoice/quotation pages with secure token, client portal, bilingual EN/AR rendering, RTL-safe layout, UAE TRN compliance, slug-based URLs with alias redirects, visual design token pass
- **Phase 5:** Automation — JSONB invoice version snapshots with safe restore, recurring billing cron, reminder email automation with 24-hour dedup, 3 new Supabase tables live in production

**What's next:** v1.1 — deepen automation (auto-send recurring), online payment collection (OPS-06), OAuth login (AUTH-05), client import (CLNT-05), richer analytics (DASH-05)

---
