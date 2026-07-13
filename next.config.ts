import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const securityHeaders = [
  {
    key: "X-Frame-Options",
    value: "DENY",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
  {
    // Per-tenant <style> injection and Recharts inline styles need 'unsafe-inline'.
    // nonce-based CSP would require Next.js middleware nonce threading — deferred.
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: blob: https:",
      "connect-src 'self' https://*.supabase.co https://*.supabase.net wss://*.supabase.co",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      // 'self' for app forms; creem.io so the checkout/billing-portal form POSTs
      // can redirect out to Creem's hosted pages (form-action gates the whole
      // redirect chain in Chromium, so the external target must be allowlisted).
      "form-action 'self' https://creem.io https://*.creem.io",
    ].join("; "),
  },
];

// Derive the Supabase storage host so next/image can optimize tenant logos
// served from signed Storage URLs. Falls back to the project-host wildcard.
function supabaseHostname(): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (url) {
    try {
      return new URL(url).hostname;
    } catch {
      // fall through to wildcard
    }
  }
  return "*.supabase.co";
}

const nextConfig: NextConfig = {
  typedRoutes: true,
  experimental: {
    serverActions: {
      bodySizeLimit: "5mb",
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: supabaseHostname(),
        pathname: "/storage/v1/object/**",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default withSentryConfig(nextConfig, {
  silent: true,
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  // Source map upload disabled in dev, enabled when SENTRY_AUTH_TOKEN is set
  widenClientFileUpload: true,
});
