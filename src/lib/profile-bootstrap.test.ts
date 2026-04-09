import { describe, expect, it, vi } from "vitest";
import type { User } from "@supabase/supabase-js";
import {
  ensureUserProfile,
  PROFILE_BOOTSTRAP_ERROR,
} from "@/lib/profile-bootstrap";

function createUser(overrides: Partial<User> = {}): User {
  return {
    id: "user-123",
    app_metadata: {},
    user_metadata: {},
    aud: "authenticated",
    created_at: "2026-04-09T00:00:00.000Z",
    email: "test@invios.app",
    ...overrides,
  } as User;
}

function createSelectChain(result: {
  data: { id: string; email: string; full_name: string | null } | null;
  error: { message: string } | null;
}) {
  const maybeSingle = vi.fn().mockResolvedValue(result);
  const eq = vi.fn().mockReturnValue({ maybeSingle });
  const select = vi.fn().mockReturnValue({ eq });

  return {
    select,
    eq,
    maybeSingle,
  };
}

describe("ensureUserProfile", () => {
  it("creates a profile when one is missing", async () => {
    const initialSelect = createSelectChain({
      data: null,
      error: null,
    });
    const finalSelect = createSelectChain({
      data: {
        id: "user-123",
        email: "test@invios.app",
        full_name: "Test User",
      },
      error: null,
    });
    const upsert = vi.fn().mockResolvedValue({ error: null });
    const from = vi
      .fn()
      .mockReturnValueOnce({ select: initialSelect.select })
      .mockReturnValueOnce({ upsert })
      .mockReturnValueOnce({ select: finalSelect.select });
    const supabase = { from } as never;

    const profile = await ensureUserProfile(
      supabase,
      createUser({
        user_metadata: { full_name: "Test User" },
      }),
    );

    expect(profile).toEqual({
      id: "user-123",
      email: "test@invios.app",
      full_name: "Test User",
    });
    expect(upsert).toHaveBeenCalledWith(
      {
        id: "user-123",
        email: "test@invios.app",
        full_name: "Test User",
      },
      {
        onConflict: "id",
        ignoreDuplicates: true,
      },
    );
  });

  it("does not write when the profile already exists", async () => {
    const existingProfile = {
      id: "user-123",
      email: "test@invios.app",
      full_name: "Existing Name",
    };
    const initialSelect = createSelectChain({
      data: existingProfile,
      error: null,
    });
    const upsert = vi.fn();
    const from = vi
      .fn()
      .mockReturnValueOnce({ select: initialSelect.select })
      .mockReturnValueOnce({ upsert });
    const supabase = { from } as never;

    const profile = await ensureUserProfile(
      supabase,
      createUser({
        user_metadata: { full_name: "New Name" },
      }),
    );

    expect(profile).toEqual(existingProfile);
    expect(upsert).not.toHaveBeenCalled();
  });

  it("surfaces a domain error when bootstrap fails", async () => {
    const initialSelect = createSelectChain({
      data: null,
      error: null,
    });
    const upsert = vi.fn().mockResolvedValue({
      error: { message: "violates foreign key constraint" },
    });
    const from = vi
      .fn()
      .mockReturnValueOnce({ select: initialSelect.select })
      .mockReturnValueOnce({ upsert });
    const supabase = { from } as never;

    await expect(ensureUserProfile(supabase, createUser())).rejects.toThrow(
      PROFILE_BOOTSTRAP_ERROR,
    );
  });
});
