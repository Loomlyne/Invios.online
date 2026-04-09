import fs from 'node:fs';
import path from 'node:path';
import { chromium } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

const projectRef = fs.readFileSync(path.resolve('supabase/.temp/project-ref'), 'utf8').trim();
const localEnv = Object.fromEntries(
  fs.readFileSync(path.resolve('.env.local'), 'utf8')
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#') && line.includes('='))
    .map((line) => {
      const [key, ...rest] = line.split('=');
      return [key, rest.join('=').replace(/^['"]|['"]$/g, '')];
    }),
);

const admin = createClient(`https://${projectRef}.supabase.co`, localEnv.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const email = `debug-${Date.now()}@invios.test`;
const password = `Invios!${Math.random().toString(36).slice(2, 12)}`;
const userRes = await admin.auth.admin.createUser({
  email,
  password,
  email_confirm: true,
  user_metadata: { full_name: 'Debug User' },
});
if (userRes.error) throw userRes.error;
const userId = userRes.data.user.id;
const clientRes = await admin.from('clients').insert({
  user_id: userId,
  name: 'Debug Client',
  company: 'Desert Studio',
  email: 'billing@desert-studio.test',
  phone: '+971500001234',
  address: 'Dubai Design District, Dubai, UAE',
  status: 'lead',
  slug: `desert-studio-${Date.now()}`,
}).select('id').single();
if (clientRes.error) throw clientRes.error;

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ baseURL: 'https://invios-phase1-koss.vercel.app' });
page.on('console', (msg) => console.log('console:', msg.type(), msg.text()));
page.on('pageerror', (err) => console.log('pageerror:', err.message));

await page.goto('/sign-in');
await page.getByLabel('Email').fill(email);
await page.getByLabel('Password').fill(password);
await page.getByRole('button', { name: 'Enter Invios' }).click();
await page.waitForURL(/\/app$/);

await page.goto('/app/settings?section=defaults');
await page.locator('[data-template-option="executive"]').click();
await page.getByRole('button', { name: 'Save defaults' }).click();
await page.waitForTimeout(1500);

await page.goto(`/app/quotations/new?clientId=${clientRes.data.id}`);
await page.getByLabel('Description').fill('Visual direction and delivery');
await page.getByLabel('Unit price').fill('1200');
await page.getByRole('button', { name: 'Create quotation' }).click();
await page.waitForTimeout(4000);

console.log('url:', page.url());
console.log('alerts:', await page.locator('[role="alert"]').allInnerTexts().catch(() => []));
console.log('body excerpt:', (await page.locator('body').innerText()).slice(0, 5000));

const q = await admin.from('quotations').select('id,quotation_number,created_at').eq('user_id', userId).order('created_at', { ascending: false }).limit(5);
console.log('quotations:', q.data, q.error);

await browser.close();
