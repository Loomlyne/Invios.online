import { describe, it, expect } from "vitest";
import {
  signInSchema,
  signUpSchema,
  emailSchema,
  updatePasswordSchema,
} from "@/actions/auth";

// ---------------------------------------------------------------------------
// signInSchema
// ---------------------------------------------------------------------------

describe("signInSchema", () => {
  it("Test 1: rejects empty email — error contains 'valid email'", () => {
    const result = signInSchema.safeParse({
      email: "not-an-email",
      password: "Invios!123",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toContain("valid email");
    }
  });

  it("Test 2: rejects password shorter than 8 chars — error contains '8 characters'", () => {
    const result = signInSchema.safeParse({
      email: "test@invios.test",
      password: "short",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toContain("8 characters");
    }
  });

  it("Test 3: accepts valid email and 8+ char password", () => {
    const result = signInSchema.safeParse({
      email: "test@invios.test",
      password: "Invios!123",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe("test@invios.test");
      expect(result.data.password).toBe("Invios!123");
    }
  });
});

// ---------------------------------------------------------------------------
// signUpSchema
// ---------------------------------------------------------------------------

describe("signUpSchema", () => {
  it("Test 4: rejects fullName shorter than 2 chars — error contains 'full name'", () => {
    const result = signUpSchema.safeParse({
      fullName: "T",
      email: "test@invios.test",
      password: "Invios!123",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toContain("full name");
    }
  });

  it("Test 5: accepts valid fullName, email, and password", () => {
    const result = signUpSchema.safeParse({
      fullName: "Test User",
      email: "test@invios.test",
      password: "Invios!123",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.fullName).toBe("Test User");
    }
  });
});

// ---------------------------------------------------------------------------
// emailSchema
// ---------------------------------------------------------------------------

describe("emailSchema", () => {
  it("Test 6: rejects invalid email format", () => {
    const result = emailSchema.safeParse({ email: "not-an-email" });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toContain("valid email");
    }
  });
});

// ---------------------------------------------------------------------------
// updatePasswordSchema
// ---------------------------------------------------------------------------

describe("updatePasswordSchema", () => {
  it("Test 7: rejects mismatched passwords — error contains 'do not match'", () => {
    const result = updatePasswordSchema.safeParse({
      password: "Invios!123",
      confirmPassword: "Invios!456",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      const confirmError = result.error.issues.find(
        (issue) => issue.path.includes("confirmPassword"),
      );
      expect(confirmError?.message).toContain("do not match");
    }
  });

  it("Test 8: accepts matching passwords of 8+ chars", () => {
    const result = updatePasswordSchema.safeParse({
      password: "Invios!123",
      confirmPassword: "Invios!123",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.password).toBe("Invios!123");
    }
  });
});
