import fs from "node:fs";
import path from "node:path";
import { expect, test, type Page } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

type Credentials = {
  email: string;
  password: string;
  fullName: string;
  userId: string;
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
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is required for Kanban E2E setup.");
  }
  return createClient(`https://${projectRef}.supabase.co`, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

async function createConfirmedUser(): Promise<Credentials> {
  const admin = getAdminClient();
  const email = `kanban-e2e-${Date.now()}-${Math.random().toString(16).slice(2)}@invios.test`;
  const password = `Invios!${Math.random().toString(36).slice(2, 12)}`;
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: "Kanban E2E" },
  });
  if (error) throw error;
  return {
    email,
    password,
    fullName: "Kanban E2E",
    userId: data.user!.id,
  };
}

async function seedClient(userId: string, name: string, company: string) {
  const admin = getAdminClient();
  const slug = `kanban-${Date.now()}`;
  const { data, error } = await admin
    .from("clients")
    .insert({
      user_id: userId,
      name,
      company,
      email: "kanban@invios.test",
      phone: "+971500000000",
      address: "Dubai, UAE",
      status: "lead",
      slug,
    })
    .select("id,slug,status")
    .single();
  if (error) throw error;
  return data;
}

async function getClientStatus(clientId: string) {
  const admin = getAdminClient();
  const { data, error } = await admin
    .from("clients")
    .select("status")
    .eq("id", clientId)
    .single();
  if (error) throw error;
  return data.status as string;
}

async function signIn(page: Page, credentials: Credentials) {
  await page.goto("/sign-in");
  await page.getByLabel("Email").fill(credentials.email);
  await page.getByRole("textbox", { name: "Password" }).fill(credentials.password);
  await page.getByRole("button", { name: "Enter Invios" }).click();
  await page.waitForURL(/\/app$/);
}

async function pointerDragKanbanCard(
  page: Page,
  cardId: string,
  toColumnStatus: string,
) {
  const card = page.locator(`[data-kanban-card="${cardId}"]`);
  const handle = card.getByRole("button", { name: "Drag card to another column" });
  const dropZone = page.locator(`[data-kanban-column="${toColumnStatus}"]`);

  await handle.scrollIntoViewIfNeeded();
  await dropZone.scrollIntoViewIfNeeded();

  const handleBox = await handle.boundingBox();
  const dropBox = await dropZone.boundingBox();
  if (!handleBox || !dropBox) {
    throw new Error("Kanban drag targets are not visible.");
  }

  const fromX = handleBox.x + handleBox.width / 2;
  const fromY = handleBox.y + handleBox.height / 2;
  const toX = dropBox.x + dropBox.width / 2;
  const toY = dropBox.y + Math.min(dropBox.height * 0.35, 80);

  await page.mouse.move(fromX, fromY);
  await page.mouse.down();
  await page.mouse.move(toX, toY, { steps: 24 });
  await page.mouse.up();
}

test.describe("Kanban drag and drop", () => {
  test.setTimeout(90_000);

  test("client card moves across columns and persists to Supabase", async ({ page }) => {
    const credentials = await createConfirmedUser();
    const clientName = `Kanban Client ${Date.now()}`;
    const seeded = await seedClient(credentials.userId, clientName, "Kanban Co");

    expect(seeded.status).toBe("lead");

    await signIn(page, credentials);
    await page.goto("/app/clients?view=kanban");
    await expect(page.getByText(clientName)).toBeVisible();

    await pointerDragKanbanCard(page, seeded.id, "active");

    await expect(page.getByText("Moved card to Active.")).toBeVisible({ timeout: 15_000 });

    await expect
      .poll(async () => getClientStatus(seeded.id), { timeout: 15_000 })
      .toBe("active");

    const activeColumn = page.locator('[data-kanban-column="active"]');
    await expect(activeColumn.getByText(clientName)).toBeVisible();
  });

  test("dropping on board gutter does not change client status", async ({ page }) => {
    const credentials = await createConfirmedUser();
    const clientName = `Gutter Client ${Date.now()}`;
    const seeded = await seedClient(credentials.userId, clientName, "Gutter Co");

    await signIn(page, credentials);
    await page.goto("/app/clients?view=kanban");
    await expect(page.getByText(clientName)).toBeVisible();

    const card = page.locator(`[data-kanban-card="${seeded.id}"]`);
    const handle = card.getByRole("button", { name: "Drag card to another column" });
    const handleBox = await handle.boundingBox();
    if (!handleBox) throw new Error("missing handle");

    await page.mouse.move(handleBox.x + handleBox.width / 2, handleBox.y + handleBox.height / 2);
    await page.mouse.down();
    await page.mouse.move(8, handleBox.y + handleBox.height / 2, { steps: 12 });
    await page.mouse.up();

    await page.waitForTimeout(500);

    expect(await getClientStatus(seeded.id)).toBe("lead");
    await expect(page.getByText("Moved card to")).not.toBeVisible();
  });
});