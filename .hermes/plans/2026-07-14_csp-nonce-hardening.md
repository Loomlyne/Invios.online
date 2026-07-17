# CSP Nonce-Based Hardening (Remove unsafe-eval / unsafe-inline)

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** Remove `'unsafe-eval'` and `'unsafe-inline'` from the `script-src` CSP directive by threading a per-request nonce through Next.js middleware. Brings the app to fintech-grade CSP compliance.

**Architecture:** Next.js 15 supports nonce-based CSP via middleware. Generate a base64 nonce per request, attach it to all `<script>` tags via a React header, and emit it in the CSP `script-src` directive. The existing `next.config.ts` static CSP headers move to middleware so they can include the dynamic nonce.

**Tech Stack:** Next.js 15 middleware, `crypto.randomUUID`, React 19 `<Script nonce>` support.

---

## Current state (investigated)

- `next.config.ts:28-30` sets a static CSP with:
  ```
  script-src 'self' 'unsafe-inline' 'unsafe-eval'
  ```
  The inline comment acknowledges: "nonce-based CSP would require Next.js middleware nonce threading — deferred."
- `style-src` also uses `'unsafe-inline'` — this is harder to remove (per-tenant `<style>` injection + Recharts inline styles). **This plan only addresses `script-src`.** Style-src stays unsafe-inline for now.
- No `middleware.ts` with content for CSP exists yet (there IS middleware for Supabase auth at `src/lib/supabase/middleware.ts`, imported by a root `middleware.ts`).
- `src/app/layout.tsx` renders the root `<html>` — nonce must be threaded here.

---

## Prerequisites

**Before starting, read:**
- `src/middleware.ts` (or wherever middleware lives) to understand the current Supabase auth middleware chain
- `src/lib/supabase/middleware.ts` to see the existing `updateSession` pattern
- The Next.js 15 docs at `node_modules/next/dist/docs/` for the current middleware API (the AGENTS.md warns this Next.js version has breaking changes)
- `src/app/layout.tsx` to see where `<Script>` tags or third-party scripts are injected

---

## Tasks

### Task 1: Locate and read the middleware chain

**Objective:** Understand where to inject the nonce without breaking Supabase session updates.

**Files to read:**
- `src/middleware.ts` (root)
- `src/lib/supabase/middleware.ts`
- `src/app/layout.tsx`

**Document findings:** Note how `updateSession` works, what the middleware returns, and whether it already sets headers.

---

### Task 2: Generate nonce in middleware

**Objective:** Create a per-request nonce and set it as a request header + CSP response header.

**Files:**
- Modify: `src/middleware.ts` (root)

**Changes:**

1. Generate nonce:
   ```ts
   const nonce = Buffer.from(crypto.randomUUID().replace(/-/g, "")).toString("base64");
   ```

2. Pass nonce to the Supabase middleware via request headers:
   ```ts
   const requestHeaders = new Headers(request.headers);
   requestHeaders.set("x-nonce", nonce);
   ```

3. After calling the existing `updateSession`, set the CSP response header:
   ```ts
   const cspHeader = [
     "default-src 'self'",
     `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`,
     "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
     "font-src 'self' https://fonts.gstatic.com",
     "img-src 'self' data: blob: https:",
     "connect-src 'self' https://*.supabase.co https://*.supabase.net wss://*.supabase.co",
     "frame-ancestors 'none'",
     "base-uri 'self'",
     "form-action 'self' https://creem.io https://*.creem.io",
   ].join("; ");

   response.headers.set("Content-Security-Policy", cspHeader);
   ```

4. Also set the nonce on `requestHeaders` so server components can read it:
   ```ts
   const response = NextResponse.next({
     request: { headers: requestHeaders },
   });
   ```

---

### Task 3: Remove static CSP from `next.config.ts`

**Objective:** Avoid duplicate / conflicting CSP headers.

**Files:**
- Modify: `next.config.ts`

**Changes:** Remove the `Content-Security-Policy` entry from the `securityHeaders` array (lines ~27-41). Keep all other security headers (`X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Strict-Transport-Security`, `Permissions-Policy`).

---

### Task 4: Thread nonce into layout and scripts

**Objective:** Ensure all inline scripts carry the nonce.

**Files:**
- Modify: `src/app/layout.tsx`

**Changes:**

1. Read nonce from headers:
   ```ts
   import { headers } from "next/headers";

   async function Layout({ children }) {
     const headersList = await headers();
     const nonce = headersList.get("x-nonce") ?? "";
     // ...
   }
   ```

2. Pass nonce to any `<Script>` components from `next/script`:
   ```tsx
   <Script src="..." nonce={nonce} />
   ```

3. If there are inline `<script>` tags, add `nonce={nonce}`.

---

### Task 5: Handle Next.js RSC inline scripts

**Objective:** Next.js injects inline scripts for hydration data. These need the nonce too.

**Note:** In Next.js 15, if the middleware sets the nonce in the CSP header AND the nonce is available via `headers()`, Next.js automatically adds it to its own inline scripts. Verify this works by:

1. Building the app
2. Checking the HTML output for `nonce` attributes on Next.js-injected scripts

If Next.js does NOT auto-add it, you may need to use the `__NEXT_DATA__` script nonce pattern or the `Script` component's `strategy="beforeInteractive"` with nonce.

**Verify:** Open browser DevTools → Console → check for CSP violations. If Next.js inline scripts are blocked, add the nonce manually.

---

### Task 6: Test all flows

**Objective:** Confirm nothing breaks.

**Run:**
```bash
pnpm build
pnpm dev
```

**Manual test checklist:**
- [ ] Landing page loads, no CSP errors in console
- [ ] Sign in / sign up works
- [ ] Dashboard loads with charts (Recharts)
- [ ] Invoice detail page loads
- [ ] PDF export works (opens new tab / downloads)
- [ ] Public invoice link loads
- [ ] Creem checkout redirect works (`form-action` unchanged)
- [ ] No inline script violations in DevTools console on any page

---

### Task 7: Commit

```bash
git add src/middleware.ts next.config.ts src/app/layout.tsx
git commit -m "security: nonce-based CSP, remove unsafe-eval and unsafe-inline from script-src"
```

---

## Risks / edge cases

- **'strict-dynamic':** Allows scripts loaded by nonce'd scripts to also execute. This is the modern best practice but can be tricky with third-party scripts. If something breaks, temporarily add back `'unsafe-inline'` for `script-src` only and investigate.
- **Recharts:** Uses inline styles, not inline scripts. Should be unaffected by `script-src` changes. Verify in DevTools.
- **Per-tenant `<style>` injection:** Still covered by `style-src 'unsafe-inline'`. This plan intentionally does NOT touch style-src because removing it requires refactoring the branding system.
- **PDF generation:** `document-pdf.ts` renders a page via Playwright — the CSP applies to the browser context. The `?print=1` page should work because it's the same Next.js app. Verify PDFs still render correctly.
- **Next.js version quirks:** The AGENTS.md explicitly warns this Next.js version has breaking changes. Read `node_modules/next/dist/docs/` for the current nonce/CSP guidance before implementing.

## Effort estimate

~3-4 hours. The nonce threading is fiddly and requires careful testing across all page types. Budget extra time for debugging CSP violations.
