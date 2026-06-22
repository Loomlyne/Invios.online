import { afterEach, describe, expect, it, vi } from "vitest";

// env.ts reads ADMIN_EMAILS at module-evaluation time, so each case loads a
// fresh module instance with the env stubbed first.
async function loadEnv(adminEmails: string) {
  vi.resetModules();
  vi.stubEnv("ADMIN_EMAILS", adminEmails);
  return import("./env");
}

describe("isAdminEmail", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("returns false for everyone when the allowlist is empty", async () => {
    const { isAdminEmail } = await loadEnv("");
    expect(isAdminEmail("anyone@example.com")).toBe(false);
  });

  it("matches allowlisted emails case-insensitively and trims spacing", async () => {
    const { isAdminEmail } = await loadEnv(" Admin@Invios.online , ops@invios.online ");
    expect(isAdminEmail("admin@invios.online")).toBe(true);
    expect(isAdminEmail("ADMIN@INVIOS.ONLINE")).toBe(true);
    expect(isAdminEmail("ops@invios.online")).toBe(true);
  });

  it("rejects non-allowlisted, empty, null, and undefined emails", async () => {
    const { isAdminEmail } = await loadEnv("admin@invios.online");
    expect(isAdminEmail("attacker@evil.com")).toBe(false);
    expect(isAdminEmail("")).toBe(false);
    expect(isAdminEmail(null)).toBe(false);
    expect(isAdminEmail(undefined)).toBe(false);
  });
});
