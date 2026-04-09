# Phase 1: Foundation & Onboarding - Context

**Gathered:** 2026-04-05
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 1 delivers the first authenticated Invios experience: account creation, sign-in, protected private routes, a mobile-ready authenticated shell, and onboarding that gets the user from zero to a configured business profile with branding, defaults, and a live invoice preview. The phase stops at setup readiness and shell usability. It does not add client management, invoice/quotation builders, dashboard metrics, payments, or public document flows.

</domain>

<decisions>
## Implementation Decisions

### Authentication Flow
- **D-01:** Use separate `Sign in` and `Create account` screens rather than a combined auth screen.
- **D-02:** Use standard Supabase email/password auth with persistent sessions across refreshes and browser restarts.
- **D-03:** After first successful sign-in, users may enter the dashboard shell before onboarding is complete.
- **D-04:** Onboarding is still functionally required. Routes that depend on business defaults, branded document data, or setup completion must hard-block until onboarding is complete.
- **D-05:** Sign-out should be available in the profile menu and in settings.

### Onboarding Structure
- **D-06:** Onboarding should run as a wizard layered over the real dashboard shell, not as a standalone setup page.
- **D-07:** Step order is fixed: business profile, branding, defaults, then preview/confirm.
- **D-08:** Business profile and document defaults are required before the user can create documents. Branding can be deferred.
- **D-09:** When onboarding is completed, send the user into a create-first-invoice empty state rather than the generic dashboard home.

### Branding And Preview
- **D-10:** Keep a live preview visible throughout onboarding.
- **D-11:** The preview should be a full invoice mock, not a lightweight branding card.
- **D-12:** Business branding inputs should support logo upload, brand color selection, and signature capture.
- **D-13:** Signature capture must support three modes: upload an existing signature image, draw a signature inline, or type a signature.
- **D-14:** Signature is strongly prompted during onboarding, but the user may mark it as add-later and still complete onboarding.
- **D-15:** If branding is incomplete, document flows should continue but show unbranded-draft warnings.

### Mobile Shell And Installability
- **D-16:** Mobile navigation should use a bottom-tab primary nav for core work. Intended core tabs named by the user: invoices, clients, new invoice, quotation, settings.
- **D-17:** Any non-core or overflow destinations can live behind settings or a secondary menu rather than expanding the tab bar further.
- **D-18:** The first authenticated shell before onboarding completion is the real dashboard shell with the onboarding wizard layered into it.
- **D-19:** Install prompting should happen after onboarding is complete, not on first authenticated visit.
- **D-20:** On small screens, onboarding should prioritize the form and expose a sticky preview button that opens the full document preview in a separate sheet.

### Claude's Discretion
- Exact route map for "safe while unconfigured" shell surfaces, as long as setup-dependent flows remain blocked before onboarding completion.
- Exact visual treatment of the onboarding overlay, progress indicator, and unbranded-draft warnings.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Core Phase Definition
- `.planning/ROADMAP.md` — Phase 1 scope, goal, and success criteria
- `.planning/REQUIREMENTS.md` — `AUTH-01..04`, `ONB-01..05`, `SET-01..02`, `UX-01`
- `.planning/PROJECT.md` — product thesis, stack constraints, and Phase 1 quality bar
- `.planning/STATE.md` — current project status and active focus
- `MEMORY.md` — approved product direction, design workflow rule, and immediate next step

### Design Direction
- `/Users/koss/.gstack/projects/INV/koss-unknown-design-20260405-144707.md` — approved primary design doc for Invios

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- No application code exists yet in the repo. Phase 1 planning should assume greenfield implementation.

### Established Patterns
- No codebase patterns are established yet.
- Project-level stack constraints are already fixed: Next.js App Router, TypeScript, Tailwind CSS, shadcn/ui, Supabase Auth/Postgres, Vercel, GitHub.
- Frontend design work must start with `aidesigner-frontend`, then `ui-ux-pro-max`.

### Integration Points
- New implementation will establish the first app shell, auth routes, onboarding routes or overlays, settings foundation, Supabase auth integration, and initial persistence schema for business profile/defaults.

</code_context>

<specifics>
## Specific Ideas

- The user wants a HoneyBook-style operator-console feel even in Phase 1, which is why onboarding should sit inside the real shell rather than a detached setup screen.
- The live preview should feel like a real invoice, not a decorative mock.
- The mobile shell should prioritize core billing actions in the tab bar and push overflow surfaces into settings/menu patterns.
- Signature setup should feel flexible and premium: upload, draw, or type.

</specifics>

<deferred>
## Deferred Ideas

None. Discussion stayed within the Phase 1 boundary.

</deferred>

---

*Phase: 01-foundation-onboarding*
*Context gathered: 2026-04-05*
