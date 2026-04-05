# Phase 1: Foundation & Onboarding - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-05T13:55:42Z
**Phase:** 1-Foundation & Onboarding
**Areas discussed:** Auth flow, Onboarding structure, Branding + live preview, Mobile shell + installability

---

## Auth flow

| Option | Description | Selected |
|--------|-------------|----------|
| Separate auth screens | Separate `Sign in` and `Create account` routes | ✓ |
| Combined auth screen | One shared screen with toggle between sign-in and sign-up | |
| Magic-link-first | Login/signup oriented around passwordless entry | |

**User's choice:** Separate auth screens.
**Notes:** User chose persistent sessions. User initially wanted dashboard access before onboarding was complete; this was refined into a softer shell-entry model where setup-dependent routes are still blocked until onboarding is complete. Sign-out should be reachable from the profile menu and settings.

---

## Onboarding structure

| Option | Description | Selected |
|--------|-------------|----------|
| One long form | Single stacked setup page | |
| Short stepper | Multi-step onboarding with progress | |
| Wizard over dashboard | Setup flow layered on top of the real authenticated shell | ✓ |

**User's choice:** Wizard over dashboard.
**Notes:** Preferred order: business profile -> branding -> defaults -> preview/confirm. Business profile and defaults are required; branding can be skipped for now. After onboarding, the user should land on a create-first-invoice empty state.

---

## Branding + live preview

| Option | Description | Selected |
|--------|-------------|----------|
| Preview always visible | Full live preview remains visible throughout onboarding | ✓ |
| Preview-only final step | Preview appears mainly at the end | |
| Small preview then full step | Compact preview during setup and full preview later | |

**User's choice:** Always-visible full invoice preview.
**Notes:** User wanted branding inputs to be rich. Logo and brand color should matter. Signature should support upload, draw, or type. Signature can still be marked "add later" and not block completion. If branding remains incomplete, document flows should warn that the document is still unbranded.

---

## Mobile shell + installability

| Option | Description | Selected |
|--------|-------------|----------|
| Bottom-tab primary nav | Core work lives in tabs | ✓ |
| Header + slide-out menu | Main navigation hidden behind drawer/menu | |
| Minimal nav only | Keep shell very light in Phase 1 | |

**User's choice:** Bottom-tab primary nav with overflow in settings/menu.
**Notes:** User explicitly named likely core tabs: invoices, clients, new invoice, quotation, settings. Extra destinations can use a secondary menu. The authenticated shell should exist before onboarding is finished. Install prompting should happen after onboarding completion. On mobile, the onboarding form stays primary and the preview opens from a sticky action into a separate full-sheet view.

---

## Claude's Discretion

- Exact route list for allowed pre-onboarding shell access
- Exact UI pattern for onboarding progress, overlay treatment, and unbranded warnings

## Deferred Ideas

None
