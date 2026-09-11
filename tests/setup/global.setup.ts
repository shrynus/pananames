import { chromium, type FullConfig } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

export default async function globalSetup(config: FullConfig): Promise<void> {
  const email = process.env.TEST_USER_EMAIL;
  const password = process.env.TEST_USER_PASSWORD;

  if (!email || !password) {
    throw new Error(
      'Missing credentials. Set TEST_USER_EMAIL and TEST_USER_PASSWORD (see .env.example).',
    );
  }

  const baseURL = config.projects[0]?.use.baseURL;
  if (typeof baseURL !== 'string') {
    throw new Error('BASE_URL must be a valid URL.');
  }

  const browser = await chromium.launch();
  const context = await browser.newContext({ baseURL });
  const page = await context.newPage();

  try {
    await page.goto('/login');
    await page.getByRole('textbox', { name: 'email' }).fill(email);
    await page.getByLabel('password').fill(password);

    const twoFactorCode = process.env.TEST_USER_2FA;
    if (twoFactorCode) {
      await page.getByRole('textbox', { name: 'code' }).fill(twoFactorCode);
    }

    await Promise.all([
      page.waitForURL((url) => url.pathname === '/domains'),
      page.getByRole('button', { name: 'Login', exact: true }).last().click(),
    ]);

    const authDirectory = path.resolve('playwright/.auth');
    await mkdir(authDirectory, { recursive: true });
    await context.storageState({ path: path.join(authDirectory, 'user.json') });
  } finally {
    await browser.close();
  }
}
