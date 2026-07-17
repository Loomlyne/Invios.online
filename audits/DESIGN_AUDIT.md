# Design & UX Audit — Invios

**Scope:** Visual system, design tokens, theming, accessibility, responsive/mobile, PWA, and key UX surfaces.
**Date:** 2026-06-22 · **Branch reviewed:** `main` @ `b1d6eaa` · **Reviewer:** automated deep audit
**Status:** Analysis only — **no code or infrastructure changes were made.**

Files examined: `src/app/globals.css`, `src/app/layout.tsx`, `src/app/(app)/app/layout.tsx`, `src/app/manifest.ts`, `src/components/public/public-page-shell.tsx`, plus the design history in PRs #2/#3/#6/#7 and `MEMORY.md`.

---

## Executive summary

Invios has a **deliberate, differentiated visual identity** — a warm "luxury stationery" system (cream paper, gold accent, Cormorant Garamond display serif over DM Sans) with a sophisticated **per-tenant theming engine** that derives an entire surface palette from a single brand color. This is well above generic-SaaS baseline and is the product's aesthetic moat. The design care shows in fluid spacing tokens, dedicated loading/empty states, and a thought-through mobile shell.

The gaps are mostly **accessibility and robustness**: contrast on the gold accent and muted text is borderline-to-failing, the public document header forces white text on an arbitrary user color (can become unreadable), there's no dark mode, brand-color input isn't validated (breaks theming and is a minor security issue), and the PWA icon set is SVG-only. None block usage; all are polish that matters for a "premium" positioning.

| Severity | Count | Headline |
|---|---|---|
| 🟠 Medium | 4 | Accent/muted contrast (WCAG AA) · White-on-brand-color header (unreadable edge cases) · No dark mode · Pricing/currency copy inconsistency |
| 🟡 Low | 6 | Unvalidated brand color breaks theming · Color-only status signals · PWA icons SVG-only + portrait lock · Reduced-motion unverified · Forced "Powered by Invios" (no white-label) · Theme-color/app-bg mismatch |
| 🟢 Strengths | 6 | Cohesive luxury system · Per-tenant palette engine · Fluid clamp tokens · `next/font` pairing · Loading/empty states · Mobile shell + PWA |

---

## Strengths (keep and build on)

- **Cohesive, premium token system** (`src/app/globals.css`): a curated warm palette (`--background:#f8f4ee`, `--accent:#ca8a04`, `--surface`, `--border-brand:#d7c4a7`), layered radial+linear background gradient, `glass-panel` blur, `soft-shadow`/`subtle-shadow`, and a serif `display-text` treatment with tight `-0.03em` tracking. It reads intentional, not template.
- **Per-tenant theming engine** (`src/app/(app)/app/layout.tsx:10-60`): `hexToTokens()` takes one brand hex and derives the accent family (RGB-scaled) **and** a full surface family via HSL (hue-preserving, saturation-clamped so greys don't tint). Injected as a `:root` override `<style>`. This is genuinely clever and gives every tenant a custom-yet-coherent look.
- **Fluid, responsive tokens**: `clamp()`-based `--space-*` and `--radius-*` scale smoothly from 320→1280px (`globals.css:28-33`) — no hard breakpoint jumps in spacing.
- **Typography done right**: `Cormorant_Garamond` (display) + `DM_Sans` (body) via `next/font/google` (`layout.tsx:6-15`) — self-hosted, no layout shift, elegant pairing that supports the "premium operator console" thesis.
- **State coverage**: dedicated `loading.tsx` skeletons for app/invoices/quotations/clients, an `EmptyState` component, a `SetupChecklist`, and `PageTransition` — the UX handles in-between states, not just the happy path.
- **Mobile-first shell**: bottom nav (twice-iterated in PRs #6/#7), a Vaul mobile sheet, an `InstallPrompt`, `viewportFit: "cover"` for notches, and a PWA manifest. The mobile color picker was purpose-redesigned (PR #3).

---

## Findings

### 🟠 D1 — Contrast: gold accent and muted text are borderline/failing WCAG AA
- `--accent:#ca8a04` (gold) on cream `--background:#f8f4ee` is roughly **~2.4:1** — well below the **4.5:1** needed for normal text and even the 3:1 for large text/UI. As a **fill/icon** color it's fine; as **text or thin iconography on light**, it fails.
- `--muted:#6b6359` on cream is roughly **~4:1** — under AA for normal body text. Secondary text using `--muted` risks failing; `--muted-strong:#3a322c` is safe.
**Recommendation:** Reserve `--accent` for fills/large elements; introduce an "accent-text" variant that's dark enough for text on light. Bump `--muted` or restrict it to large/secondary contexts. Run an automated contrast pass.

### 🟠 D2 — Public document header forces white text on an arbitrary brand color
`PublicPageShell` paints the header `backgroundColor: primaryColor` and the business name in **hardcoded white** (`src/components/public/public-page-shell.tsx:23,37-39`). With the default gold, white-on-gold is ~2.4:1; if a tenant picks a **light** brand color (pale yellow, mint, white), the business name becomes invisible. This is the **first thing the client sees** on a shared invoice — a brand-credibility surface.
**Recommendation:** Compute readable foreground from the chosen color (luminance-based black/white pick), and/or constrain the header to a sufficiently dark shade of the brand color (the `hexToTokens` `strong` 0.7× variant is a start, but still not guaranteed).

### 🟠 D3 — No dark mode
The system is light-only. There's no `prefers-color-scheme` handling, yet the PWA `theme_color` is dark `#1c1917` (`manifest.ts:13`) over a cream app — so the OS chrome (status bar / PWA splash) doesn't match the UI.
**Recommendation:** Either commit to light-only and align `theme_color`/`background_color` to the cream system, or add a dark theme (the token architecture already makes this tractable).

### 🟠 D4 — Pricing & currency copy is inconsistent across surfaces
Across the product, the plan is variously shown as **AED 50/mo**, **$19/mo (or $15 annual)**, and **$15/mo USD** (see commit/PR history; cross-ref Functionality M5). The pricing card, landing inline pricing, billing panel, and legal pages don't agree.
**Impact:** On the highest-intent design surface (the pricing decision), inconsistency erodes trust and looks unfinished.
**Recommendation:** One pricing constant rendered everywhere; pick the currency deliberately (the product is UAE-aware → AED vs USD is a real decision).

### 🟡 D5 — Brand color isn't validated → theming silently breaks
`primary_color`/`secondary_color` are stored raw (`src/actions/app.ts:221,544`) and `hexToTokens` falls back only on a strict 6-hex match. Anything else (3-digit hex, named color, empty, stray text) yields broken tokens — and the invalid branch echoes the raw string into the injected `<style>` (also the low-severity CSS-injection noted in the Security audit, L2).
**Recommendation:** Validate `^#[0-9a-fA-F]{6}$` on save with inline form feedback; normalise to a canonical hex; never echo unvalidated input into CSS.

### 🟡 D6 — Status is partly conveyed by color alone
Kanban status dots and accent treatments lean on color to signal state (e.g. the beige `#d7c4a7` vs green markers described in `MEMORY.md`). Where a colored dot is the *only* signal, that fails WCAG 1.4.1 (use of color) and hurts color-blind users. (Badges that include text labels are fine.)
**Recommendation:** Pair color with a shape/label/icon anywhere color is the sole status carrier.

### 🟡 D7 — PWA icons are SVG-only; portrait-locked; no screenshots
`manifest.ts` ships only `icon.svg` + `icon-maskable.svg` (`sizes:"any"`). Modern Chrome accepts SVG, but **iOS and several install surfaces expect raster** (PNG 192/512, apple-touch-icon). `orientation:"portrait"` locks tablet/desktop installs; there are no `screenshots` for a richer install card.
**Recommendation:** Add PNG `192`/`512` (incl. a maskable PNG) and an apple-touch-icon; reconsider the portrait lock for larger screens; add install screenshots.

### 🟡 D8 — Motion: `prefers-reduced-motion` not confirmed
There's a `PageTransition` and a `scroll-smooth` root, plus animated nav (FAB plus→X). I did not find a `prefers-reduced-motion` guard.
**Recommendation:** Verify animations/transitions respect reduced-motion (vestibular accessibility) and that `scroll-smooth` is gated accordingly.

### 🟡 D9 — Forced "Powered by Invios" on public docs (no white-label)
Every public invoice/quotation footer hardcodes a "Powered by Invios" link (`public-page-shell.tsx:46-54`). Great for growth, but a paying "premium" tenant sending invoices to their clients may want this removed.
**Recommendation:** Make it a Pro/white-label toggle — turns a design constraint into a billing feature.

### 🟡 D10 — Theme-color vs app-background mismatch (see D3)
`theme_color:#1c1917` and `background_color:#f8f4ee` in the manifest describe two different palettes; the dark theme color will frame a light app oddly on Android/PWA.

---

## Responsive / mobile / i18n notes
- **Responsive:** fluid tokens + `overflow-x:hidden` + dedicated mobile nav/sheet = strong. Verify wide tables (payments/expenses, kanban) and the invoice **builder** at 320–360px — document-heavy builders are the usual mobile pain point (PR notes mention date-picker portaling fixes, which is the right instinct).
- **Bilingual EN/AR:** documents support Arabic + RTL (a real differentiator). Confirm the **app shell** (not just rendered documents) is acceptable for Arabic-preferring users, or scope RTL explicitly to documents.
- **Print fidelity:** the public page has a dedicated `print` mode used for PDF generation (`?print=1`) so on-screen and exported documents share one renderer — excellent for consistency.

## What's missing / what to add
- **An accessibility pass**: automated contrast audit + keyboard/focus-visible review + color-blind check. For a product touching money, AA should be the floor. (PR #5 already added aria-live/keyboard nav in settings — extend that rigor app-wide.)
- **A documented design-token reference / lightweight style guide** so the cream/gold system and the `hexToTokens` derivation rules are captured (today they live only in code + an external design doc referenced in `MEMORY.md:33`).
- **Dark mode** (or an explicit decision against it) with manifest alignment.
- **Contrast-aware theming**: extend `hexToTokens` to also emit a guaranteed-readable on-accent foreground (fixes D2 systemically).
- **Complete PWA polish**: raster icons, screenshots, maskable PNG, install metadata.
- **White-label option** for Pro (D9) — design + billing win.
- **Empty/error illustration consistency** and a root `error.tsx` (the latter arrives in PR #15) so failure states feel as designed as the happy path.
