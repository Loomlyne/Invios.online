import { afterEach, describe, expect, it } from "vitest";
import { getSessionCookieDomain } from "@/lib/supabase/cookies";

const originalSiteUrl = process.env.NEXT_PUBLIC_SITE_URL;

afterEach(() => {
  process.env.NEXT_PUBLIC_SITE_URL = originalSiteUrl;
});

describe("getSessionCookieDomain", () => {
  it("uses the apex domain for the configured production host", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://invios.online";

    expect(getSessionCookieDomain("invios.online")).toBe(".invios.online");
    expect(getSessionCookieDomain("www.invios.online")).toBe(".invios.online");
  });

  it("keeps preview and legacy hosts host-only", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://invios.online";

    expect(getSessionCookieDomain("invios.vercel.app")).toBeUndefined();
    expect(getSessionCookieDomain("localhost:3000")).toBeUndefined();
  });
});
