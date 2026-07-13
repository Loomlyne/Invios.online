# Error Monitoring (Sentry)

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** Capture all unhandled errors in production (server + client + edge) so we stop flying blind on the live product.

**Architecture:** `@sentry/nextjs` with source maps, covering server components, client components, route handlers, and the two error boundaries. Free tier (Sentry SaaS) is sufficient for a solo-operator SaaS at current traffic.

**Tech Stack:** `@sentry/nextjs`, Sentry SaaS project, Next.js 15 instrumentation hooks.

---

## Current state (investigated)

- `src/app/error.tsx:14-18` — only `console.error(error)`. Errors go to browser console, nowhere else.
- `src/app/global-error.tsx:17-19` — only `console.error("[app/global-error]", error)`.
- No `sentry.*` config files, no `instrumentation.ts`, no `SENTRY_DSN` env var referenced anywhere.
- Next.js 15 supports `instrumentation.ts` at project root and `sentry.server.config.ts` / `sentry.client.config.ts` + `sentry.edge.config.ts`.
- `next.config.ts` currently exports a plain `NextConfig`. Sentry wraps it via `withSentryConfig`.

---

## Tasks

### Task 1: Install Sentry SDK

**Objective:** Add the package.

**Run:**
```bash
pnpm add @sentry/nextjs
```

**Verification:** `package.json` shows `@sentry/nextjs` in dependencies.

---

### Task 2: Create Sentry config files

**Objective:** Configure Sentry for server, client, and edge runtimes.

**Files:**
- Create: `sentry.client.config.ts`
- Create: `sentry.server.config.ts`
- Create: `sentry.edge.config.ts`

**sentry.client.config.ts:**
```ts
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.1,
  environment: process.env.NODE_ENV,
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 1.0,
  integrations: [
    Sentry.replayIntegration({
      maskAllText: false,
      blockAllMedia: true,
    }),
  ],
});
```

**sentry.server.config.ts:**
```ts
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 0.1,
  environment: process.env.NODE_ENV,
});
```

**sentry.edge.config.ts:**
```ts
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.1,
  environment: process.env.NODE_ENV,
});
```

---

### Task 3: Create `instrumentation.ts`

**Objective:** Tell Next.js to load Sentry on server start.

**Files:**
- Create: `instrumentation.ts` (project root, alongside `next.config.ts`)

```ts
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }
  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}
```

---

### Task 4: Wrap `next.config.ts` with Sentry

**Objective:** Enable source map upload and webpack tweaking.

**Files:**
- Modify: `next.config.ts`

**Changes:** Import `withSentryConfig` and wrap the existing config. Add at the bottom:

```ts
import { withSentryConfig } from "@sentry/nextjs";

// ... existing const nextConfig ...

export default withSentryConfig(nextConfig, {
  silent: true,
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  // Source map upload disabled in dev, enabled when SENTRY_AUTH_TOKEN is set
  widenClientFileUpload: true,
});
```

**Important:** Keep all existing `securityHeaders`, `images.remotePatterns`, `experimental.serverActions` config intact. Only wrap the export.

---

### Task 5: Wire error boundaries to Sentry

**Objective:** Send caught errors to Sentry, not just console.

**Files:**
- Modify: `src/app/error.tsx`
- Modify: `src/app/global-error.tsx`

**Changes in `error.tsx`:**
```tsx
import * as Sentry from "@sentry/nextjs";

// In the useEffect:
useEffect(() => {
  Sentry.captureException(error);
  console.error(error);
}, [error]);
```

**Changes in `global-error.tsx`:** Same — import Sentry and call `Sentry.captureException(error)` alongside the existing console.error.

---

### Task 6: Add environment variables

**Files:**
- Modify: `.env.example` (add documentation)
- Vercel project settings (manual — add `SENTRY_DSN`, `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_ORG`, `SENTRY_PROJECT`, `SENTRY_AUTH_TOKEN`)

Add to `.env.example`:
```bash
# Sentry (error monitoring) — create project at sentry.io
SENTRY_DSN=               # Server-side DSN (secret)
NEXT_PUBLIC_SENTRY_DSN=   # Client-side DSN (public, safe to expose)
SENTRY_ORG=               # Sentry org slug
SENTRY_PROJECT=           # Sentry project slug
SENTRY_AUTH_TOKEN=        # Only needed on Vercel for source map upload
```

---

### Task 7: Verify build + commit

**Run:**
```bash
pnpm typecheck
pnpm build
```

**Verify:** Build succeeds. Sentry SDK initializes without errors in build output.

**Commit:**
```bash
git add sentry.client.config.ts sentry.server.config.ts sentry.edge.config.ts \
        instrumentation.ts next.config.ts src/app/error.tsx src/app/global-error.tsx .env.example
git commit -m "feat: add Sentry error monitoring for server, client, and edge runtimes"
```

---

## Risks / edge cases

- **Bundle size:** `@sentry/nextjs` adds ~30KB gzipped client-side. Acceptable for the value.
- **Source maps:** If `SENTRY_AUTH_TOKEN` is not set on Vercel, source maps won't upload but the app still works — errors will just show minified traces.
- **Performance tracing:** `tracesSampleRate: 0.1` keeps cost down. Increase if debugging perf issues.
- **Replays:** `replaysSessionSampleRate: 0` (off by default), `replaysOnErrorSampleRate: 1.0` (capture on errors only). This avoids storing session replay data unless something breaks.

## Prerequisites

- Create a Sentry project at sentry.io (free tier: 5K errors/month, 50 replays/month).
- Copy the DSN from project settings.

## Effort estimate

~1 hour. Mostly config files + Vercel env var setup.
