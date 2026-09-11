import { expect, type Locator, type Page } from '@playwright/test';
import { parseMoney } from '../support/money';

export class CartPage {
  constructor(private readonly page: Page) {}

  async goto(): Promise<void> {
    await this.page.goto('/cart');
    await expect
      .poll(async () => {
        const empty = await this.page.getByRole('heading', { name: /Cart is empty/i }).count();
        const rows = await this.page.locator('tbody tr').count();
        return empty > 0 || rows > 0;
      })
      .toBe(true);
  }

  async clear(): Promise<void> {
    await this.goto();

    while (await this.page.locator('tbody tr').count()) {
      const previousCount = await this.page.locator('tbody tr').count();
      const row = this.page.locator('tbody tr').first();
      await row.locator('td').last().getByRole('button').click();
      await expect.poll(() => this.page.locator('tbody tr').count()).toBe(previousCount - 1);
    }

    await expect(this.page.getByRole('heading', { name: /Cart is empty/i })).toBeVisible();
  }

  itemRow(domain: string): Locator {
    return this.page
      .getByRole('row')
      .filter({ has: this.page.getByText(domain, { exact: true }) });
  }

  async itemTotal(domain: string): Promise<number> {
    const row = this.itemRow(domain);
    await expect(row).toBeVisible();
    const headers = await this.page
      .locator('thead th')
      .evaluateAll((elements) => elements.map((element) => element.getAttribute('title')));
    const totalColumn = headers.indexOf('Total');
    expect(totalColumn, 'Cart Total column was not found').toBeGreaterThanOrEqual(0);
    return parseMoney(await row.locator('td').nth(totalColumn).innerText());
  }

  async total(): Promise<number> {
    const total = this.page.getByText(/^TOTAL:\s*\$/).last();
    await expect(total).toBeVisible();
    return parseMoney(await total.innerText());
  }
}
