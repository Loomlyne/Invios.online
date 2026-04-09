import fs from "node:fs";
import path from "node:path";
import { expect, test, type Page } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

type Credentials = {
  email: string;
  password: string;
  fullName: string;
  userId?: string;
};

const projectRef = fs
  .readFileSync(path.resolve(process.cwd(), "supabase/.temp/project-ref"), "utf8")
  .trim();
const localEnv = Object.fromEntries(
  fs
    .readFileSync(path.resolve(process.cwd(), ".env.local"), "utf8")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith("#") && line.includes("="))
    .map((line) => {
      const [key, ...rest] = line.split("=");
      return [key, rest.join("=").replace(/^['"]|['"]$/g, "")];
    }),
) as Record<string, string>;

function getAdminClient() {
  const serviceRoleKey = localEnv.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceRoleKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is required for seeded E2E setup.");
  }

  return createClient(`https://${projectRef}.supabase.co`, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

async function createConfirmedUser(): Promise<Credentials> {
  const admin = getAdminClient();
  const email = `e2e-${Date.now()}-${Math.random().toString(16).slice(2)}@invios.test`;
  const password = `Invios!${Math.random().toString(36).slice(2, 12)}`;
  const fullName = "Invios E2E";
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: fullName,
    },
  });

  if (error) {
    throw error;
  }

  return {
    email,
    password,
    fullName,
    userId: data.user.id,
  };
}

async function seedClient(userId: string, name: string, company: string) {
  const admin = getAdminClient();
  const slug = `${company.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}-${Date.now()}`;
  const { data, error } = await admin
    .from("clients")
    .insert({
      user_id: userId,
      name,
      company,
      email: "billing@desert-studio.test",
      phone: "+971500001234",
      address: "Dubai Design District, Dubai, UAE",
      status: "lead",
      slug,
    })
    .select("id,slug")
    .single();

  if (error) {
    throw error;
  }

  return data;
}

async function getLatestDocumentId(
  table: "quotations" | "invoices",
  userId: string,
) {
  const admin = getAdminClient();
  const { data, error } = await admin
    .from(table)
    .select("id")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data?.id ?? null;
}

async function waitForLatestDocumentId(
  table: "quotations" | "invoices",
  userId: string,
) {
  await expect
    .poll(async () => getLatestDocumentId(table, userId), { timeout: 10_000 })
    .not.toBeNull();

  return getLatestDocumentId(table, userId);
}

async function setQuotationAccepted(id: string) {
  const admin = getAdminClient();
  const acceptedAt = new Date().toISOString();
  const { error } = await admin
    .from("quotations")
    .update({
      status: "accepted",
      accepted_date: acceptedAt,
      rejected_date: null,
      rejection_reason: null,
    })
    .eq("id", id);

  if (error) {
    throw error;
  }
}

async function signIn(page: Page, credentials: Credentials) {
  await page.goto("/sign-in");
  await page.getByLabel("Email").fill(credentials.email);
  await page.getByLabel("Password").fill(credentials.password);
  await page.getByRole("button", { name: "Enter Invios" }).click();
  await page.waitForURL(/\/app$/);
}

async function signUpAndEnterApp(page: Page): Promise<Credentials> {
  const credentials: Credentials = {
    email: `e2e-${Date.now()}-${Math.random().toString(16).slice(2)}@invios.test`,
    password: `Invios!${Math.random().toString(36).slice(2, 12)}`,
    fullName: "Invios E2E",
  };

  await page.goto("/sign-up");
  await page.getByLabel("Full name").fill(credentials.fullName);
  await page.getByLabel("Email").fill(credentials.email);
  await page.getByLabel("Password").fill(credentials.password);
  await page.getByRole("button", { name: "Create account" }).click();
  await page.waitForURL(/\/app/, { timeout: 15_000 });

  return credentials;
}

async function expectReadableButton(page: Page, name: string) {
  const button = page.getByRole("link", { name }).first();
  await expect(button).toBeVisible();

  const styles = await button.evaluate((element) => {
    const computed = window.getComputedStyle(element);

    return {
      color: computed.color,
      backgroundColor: computed.backgroundColor,
      borderColor: computed.borderColor,
    };
  });

  expect(styles.color).not.toBe("rgba(0, 0, 0, 0)");
  expect(styles.color).not.toBe(styles.backgroundColor);
}

async function expectDetailPath(page: Page, kind: "quotations" | "invoices") {
  await expect
    .poll(() => new URL(page.url()).pathname)
    .toMatch(new RegExp(`^/app/${kind}/(?!new$)[^/]+$`));
}

test("sign-up surface submits and either redirects or confirms verification", async ({ page }) => {
  const unique = Date.now().toString(36);

  await page.goto("/sign-up");
  await page.getByLabel("Full name").fill("Sign Up Flow");
  await page.getByLabel("Email").fill(`signup-${unique}@invios.test`);
  await page.getByLabel("Password").fill(`Invios!${unique}Pass`);
  await page.getByRole("button", { name: "Create account" }).click();

  await Promise.race([
    page.waitForURL(/\/app/, { timeout: 15_000 }),
    expect(
      page.getByText("Account created. Check your inbox to verify your email before signing in."),
    ).toBeVisible({ timeout: 15_000 }),
  ]);
});

test("sign-out clears session and redirects to sign-in", async ({ page }) => {
  // Step 1: Create a confirmed user and sign in
  const credentials = await createConfirmedUser();
  await signIn(page, credentials);

  // Step 2: Verify we are in the authenticated shell
  await expect(page.getByRole("button", { name: "Sign out" })).toBeVisible();

  // Step 3: Click sign-out
  await page.getByRole("button", { name: "Sign out" }).click();

  // Step 4: Verify redirect to /sign-in
  await page.waitForURL(/\/sign-in/, { timeout: 10_000 });

  // Step 5: Verify session is cleared — visiting /app should redirect back to /sign-in
  await page.goto("/app");
  await page.waitForURL(/\/sign-in/, { timeout: 10_000 });
  expect(new URL(page.url()).pathname).toBe("/sign-in");
});

test("shell shortcuts and empty states route into live surfaces", async ({ page }) => {
  await signUpAndEnterApp(page);
  await page.waitForLoadState("networkidle");
  await expectReadableButton(page, "New invoice");

  await page.getByRole("link", { name: "Template defaults" }).click();
  await page.waitForURL(/\/app\/settings\?section=defaults/);
  await expect(page.getByText("Global document template")).toBeVisible();

  await page.goto("/app/invoices");
  await expect(page.getByText("No invoices in the workspace yet.")).toBeVisible();

  await page.goto("/app/invoices?status=paid");
  await expect(page.getByText("No invoices match the current filters.")).toBeVisible();
  await page.getByRole("link", { name: "Clear filters" }).click();
  await page.waitForURL(/\/app\/invoices$/);
});

test("critical client to quotation to invoice flow stays template-consistent", async ({ page }) => {
  const credentials = await createConfirmedUser();
  const clientName = `Client ${Date.now()}`;
  const companyName = "Desert Studio";
  const seededClient = await seedClient(credentials.userId!, clientName, companyName);

  await signIn(page, credentials);

  await page.goto("/app/settings?section=defaults");
  await page.locator('[data-template-option="executive"]').click();
  await page.getByRole("button", { name: "Save defaults" }).click();
  await page.waitForTimeout(1000);
  const finalizingSetup = page.getByText("Finalizing setup");

  if (await finalizingSetup.isVisible().catch(() => false)) {
    await expect(finalizingSetup).not.toBeVisible({ timeout: 15_000 });
  }

  await page.goto(`/app/clients/${seededClient.slug}`);

  await expectReadableButton(page, "Edit client");
  await page.goto(`/app/quotations/new?clientId=${seededClient.id}`);

  await expect(page.locator('[data-document-template="executive"]')).toBeVisible();
  await page.getByLabel("Description").fill("Visual direction and delivery");
  await page.getByLabel("Unit price").fill("1200");
  await page.getByRole("button", { name: "Create quotation" }).click();
  const quotationId = await waitForLatestDocumentId("quotations", credentials.userId!);
  await page.goto(`/app/quotations/${quotationId}`);

  await expect(page.locator('[data-document-template="executive"]')).toBeVisible();
  await expect(page.getByText("Quotation detail", { exact: true })).toBeVisible();
  await expect(page.locator('a[href*="/quotations/public/"]').first()).toBeVisible();

  const quotationShareUrl = await page.locator('a[href*="/quotations/public/"]').first().getAttribute("href");
  expect(quotationShareUrl).toBeTruthy();

  await setQuotationAccepted(quotationId);
  await page.reload();
  const convertButton = page.getByRole("button", { name: "Convert to invoice" });
  await expect(convertButton).toBeEnabled();
  await convertButton.click();
  const invoiceId = await waitForLatestDocumentId("invoices", credentials.userId!);
  await page.goto(`/app/invoices/${invoiceId}`);
  await expect(page.locator('[data-document-template="executive"]')).toBeVisible();
  await expect(page.locator('a[href*="/invoices/public/"]').first()).toBeVisible();

  const invoiceShareUrl = await page.locator('a[href*="/invoices/public/"]').first().getAttribute("href");
  const pdfUrl = await page.locator('a[href*="/api/invoices/"][href$="/pdf"]').first().getAttribute("href");
  expect(invoiceShareUrl).toBeTruthy();
  expect(pdfUrl).toBeTruthy();

  await page.goto(quotationShareUrl!);
  await expect(page.locator('[data-document-template="executive"]')).toBeVisible();

  await page.goto(`${quotationShareUrl!}?print=1`);
  await expect(page.locator('[data-document-template="executive"]')).toBeVisible();

  await page.goto(invoiceShareUrl!);
  await expect(page.locator('[data-document-template="executive"]')).toBeVisible();

  await page.goto(`${invoiceShareUrl!}?print=1`);
  await expect(page.locator('[data-document-template="executive"]')).toBeVisible();

  const pdfResponse = await page.context().request.get(pdfUrl!);
  expect(pdfResponse.ok()).toBeTruthy();
  expect(pdfResponse.headers()["content-type"]).toContain("application/pdf");
  expect((await pdfResponse.body()).byteLength).toBeGreaterThan(1024);
});
