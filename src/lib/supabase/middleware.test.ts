import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// --- Module mocks ---
vi.mock("@/lib/env", () => ({
  isSupabaseConfigured: vi.fn(() => true),
  env: {
    supabaseUrl: "https://test.supabase.co",
    supabasePublishableKey: "test-key",
  },
}));

vi.mock("@supabase/ssr", () => ({
  createServerClient: vi.fn(),
}));

// Import after mocks are defined
import { updateSession } from "@/lib/supabase/middleware";
import { isSupabaseConfigured } from "@/lib/env";
import { createServerClient } from "@supabase/ssr";

const mockIsSupabaseConfigured = vi.mocked(isSupabaseConfigured);
const mockCreateServerClient = vi.mocked(createServerClient);

function mockRequest(pathname: string): NextRequest {
  return new NextRequest(new URL(pathname, "http://localhost:3000"));
}

function mockSupabaseClient(user: { id: string } | null) {
  mockCreateServerClient.mockReturnValue({
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user },
      }),
    },
    // Satisfy TS: other methods we don't care about
  } as unknown as ReturnType<typeof createServerClient>);
}

beforeEach(() => {
  vi.clearAllMocks();
  mockIsSupabaseConfigured.mockReturnValue(true);
});

describe("updateSession middleware", () => {
  it("Test 1: returns NextResponse.next() when Supabase is not configured", async () => {
    mockIsSupabaseConfigured.mockReturnValue(false);

    const response = await updateSession(mockRequest("/app/dashboard"));

    expect(response.headers.get("location")).toBeNull();
  });

  it("Test 2: redirects unauthenticated /app request to /sign-in with ?next= param", async () => {
    mockSupabaseClient(null);

    const response = await updateSession(mockRequest("/app/invoices"));

    const location = response.headers.get("location");
    expect(location).not.toBeNull();
    const redirectUrl = new URL(location!);
    expect(redirectUrl.pathname).toBe("/sign-in");
    expect(redirectUrl.searchParams.get("next")).toBe("/app/invoices");
  });

  it("Test 3: redirects authenticated /sign-in request to /app", async () => {
    mockSupabaseClient({ id: "test-user" });

    const response = await updateSession(mockRequest("/sign-in"));

    const location = response.headers.get("location");
    expect(location).not.toBeNull();
    const redirectUrl = new URL(location!);
    expect(redirectUrl.pathname).toBe("/app");
  });

  it("Test 4: redirects authenticated /sign-up request to /app", async () => {
    mockSupabaseClient({ id: "test-user" });

    const response = await updateSession(mockRequest("/sign-up"));

    const location = response.headers.get("location");
    expect(location).not.toBeNull();
    const redirectUrl = new URL(location!);
    expect(redirectUrl.pathname).toBe("/app");
  });

  it("Test 5: passes through when authenticated user accesses /app", async () => {
    mockSupabaseClient({ id: "test-user" });

    const response = await updateSession(mockRequest("/app/dashboard"));

    expect(response.headers.get("location")).toBeNull();
  });

  it("Test 6: passes through when unauthenticated user accesses /sign-in", async () => {
    mockSupabaseClient(null);

    const response = await updateSession(mockRequest("/sign-in"));

    expect(response.headers.get("location")).toBeNull();
  });
});
