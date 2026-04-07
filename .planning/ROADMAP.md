# ROADMAP

## Summary

Project: Invios  
Phases: 5  
Mapped requirements: 56 / 56  
Coverage: 100%

## Phase Overview

| # | Phase | Goal | Requirements |
|---|-------|------|--------------|
| 1 | Foundation & Onboarding | Get a new user signed in, branded, and ready to work from an installable app shell | AUTH-01..04, ONB-01..05, SET-01..02, UX-01 |
| 2 | 1/6 | In Progress|  |
| 3 | Dashboard & Cash Flow | Make the operator clearly see what was billed, collected, due, and profitable | DASH-01..04, OPS-01..05, UX-02 |
| 4 | Public Trust Surfaces | Make public document experiences and compliance/localization feel professional and reliable | PUB-01..04, SET-03..04, UX-03, UX-04 |
| 5 | Automation & Recovery | Add version safety, recurring workflows, and reminder automation without breaking financial truth | AUTO-01..05 |

## Phase Details

### Phase 1: Foundation & Onboarding

**Goal**  
Get a user from zero to a branded, configured workspace that feels installable and mobile-ready.

**Requirements**  
AUTH-01, AUTH-02, AUTH-03, AUTH-04  
ONB-01, ONB-02, ONB-03, ONB-04, ONB-05  
SET-01, SET-02  
UX-01

**Plans:** 3 plans

Plans:
- [x] 01-01-PLAN.md — Wave 0 unit test infrastructure (middleware route protection, setup progress derivation, auth schema validation)
- [x] 01-02-PLAN.md — D-09 post-onboarding redirect to /app/invoices/new + mobile nav UX-01 verification
- [x] 01-03-PLAN.md — Sign-out E2E test (AUTH-03) + Vercel deploy verification checkpoint

**Success Criteria**
1. A new user can sign up, sign in, and get redirected into onboarding without touching broken routes.
2. The user can complete branding and defaults setup and see a live branded invoice preview before entering the main app.
3. The app shell feels usable on small mobile widths and can be prepared for installability.
4. Core business profile and default document settings persist correctly.

**Design prerequisite**
- Before any frontend design or implementation starts for this phase, invoke `aidesigner-frontend`, then `ui-ux-pro-max`.

**Infra / deploy prerequisite**
- While planning and executing this phase, check Supabase and Vercel implications in parallel.
- If the phase ends with working code, deploy to Vercel and verify the live result before calling the phase done.

**UI hint**: yes

### Phase 2: Clients & Document Engine

**Goal**  
Enable the primary product loop: create a client, build a quotation or invoice, preview it live, export it, and share it.

**Requirements**  
CLNT-01, CLNT-02, CLNT-03, CLNT-04  
QUOT-01, QUOT-02, QUOT-03, QUOT-04, QUOT-05, QUOT-06, QUOT-07  
INV-01, INV-02, INV-03, INV-04, INV-05, INV-06, INV-07, INV-08

**Plans:** 1/6 plans executed

Plans:
- [x] 02-00-PLAN.md — Wave 0 behavioral test scaffolds (client/quotation/invoice schema validation)
- [x] 02-01-PLAN.md — Build ShareModal, DocumentStatusActions, and DocumentSummaryRow components
- [x] 02-02-PLAN.md — Builder D-04 status dropdown removal + D-06 conversion redirect fix + PDF maxDuration
- [x] 02-03-PLAN.md — Wire invoice and quotation detail pages with new components + D-07 lock
- [x] 02-04-PLAN.md — Client detail page DocumentSummaryRow integration (D-08)
- [x] 02-05-PLAN.md — Full product loop verification + Vercel production deploy

**Success Criteria**
1. A user can create a client and immediately generate a quotation or invoice for that client.
2. Quotation and invoice builders support structured line items, dates, tax, discount, notes, and terms.
3. Preview, public share, and PDF export all show the same branded document structure.
4. An accepted quotation can be converted into an invoice without retyping everything.

**Design prerequisite**
- Before any frontend design or implementation starts for this phase, invoke `aidesigner-frontend`, then `ui-ux-pro-max`.

**Infra / deploy prerequisite**
- While planning and executing this phase, check Supabase and Vercel implications in parallel.
- If the phase ends with working code, deploy to Vercel and verify the live result before calling the phase done.

**UI hint**: yes

### Phase 3: Dashboard & Cash Flow

**Goal**  
Turn Invios into an operator console that exposes cash flow, follow-up urgency, and invoice profitability.

**Requirements**  
DASH-01, DASH-02, DASH-03, DASH-04  
OPS-01, OPS-02, OPS-03, OPS-04, OPS-05  
UX-02

**Success Criteria**
1. The dashboard clearly shows billed, collected, due, collection rate, and overdue work.
2. Users can record multiple payments and expenses against a single invoice.
3. Invoice status updates automatically based on payment records and due date.
4. Profit amount and margin are visible per invoice and reflect expense changes correctly.

**Design prerequisite**
- Before any frontend design or implementation starts for this phase, invoke `aidesigner-frontend`, then `ui-ux-pro-max`.

**Infra / deploy prerequisite**
- While planning and executing this phase, check Supabase and Vercel implications in parallel.
- If the phase ends with working code, deploy to Vercel and verify the live result before calling the phase done.

**UI hint**: yes

### Phase 4: Public Trust Surfaces

**Goal**  
Make client-facing links, compliance details, and localization feel good enough to send to real clients.

**Requirements**  
PUB-01, PUB-02, PUB-03, PUB-04  
SET-03, SET-04  
UX-03, UX-04

**Success Criteria**
1. Public invoice and quotation links work without authentication and look professional.
2. Client portal links show the correct document set for a client without leaking unrelated data.
3. UAE-friendly tax invoice fields and AED support are rendered correctly.
4. English/Arabic bilingual rendering and RTL-safe layout work for core document surfaces.
5. Canonical slugs and alias redirects preserve working links when names change.

**Design prerequisite**
- Before any frontend design or implementation starts for this phase, invoke `aidesigner-frontend`, then `ui-ux-pro-max`.

**Infra / deploy prerequisite**
- While planning and executing this phase, check Supabase and Vercel implications in parallel.
- If the phase ends with working code, deploy to Vercel and verify the live result before calling the phase done.

**UI hint**: yes

### Phase 5: Automation & Recovery

**Goal**  
Add safety and automation so users can recover mistakes and reduce repetitive billing work.

**Requirements**  
AUTO-01, AUTO-02, AUTO-03, AUTO-04, AUTO-05

**Success Criteria**
1. Invoice versions are captured on save and can be reviewed later.
2. Restoring an older version is safe and does not silently corrupt financial state.
3. Users can configure recurring billing schedules for repeat invoice generation.
4. Reminder timing rules can be configured and reminder sends are logged to prevent duplicates.

**Design prerequisite**
- Before any frontend design or implementation starts for this phase, invoke `aidesigner-frontend`, then `ui-ux-pro-max`.

**Infra / deploy prerequisite**
- While planning and executing this phase, check Supabase and Vercel implications in parallel.
- If the phase ends with working code, deploy to Vercel and verify the live result before calling the phase done.

**UI hint**: yes
