import { expect, type Locator, type Page } from '@playwright/test';
import { lastMoneyValue } from '../support/money';

export class DomainRegistrationPage {
  constructor(private readonly page: Page) {}

  async goto(): Promise<void> {
    await this.page.goto('/register-domain');
    await expect(
      this.page.getByRole('heading', { name: /Domain availability check and order/ }),
    ).toBeVisible();
  }

  async search(query: string): Promise<void> {
    const input = this.page.getByPlaceholder('Enter domain name or keyword');
    await input.fill(query);
    await input.press('Enter');
    await expect(this.page.getByText('HIDE UNAVAILABLE')).toBeVisible();
  }

  result(domain: string): Locator {
    return this.page
      .getByRole('listitem')
      .filter({ has: this.page.getByText(domain, { exact: true }) });
  }

  async addToCart(domain: string): Promise<number> {
    const result = this.result(domain);
    await expect(result, `${domain} search result was not returned`).toBeVisible();
    const addButton = result.getByRole('button', { name: 'Add to cart' });
    await expect(addButton, `${domain} must be available`).toBeVisible();

    const expectedTotal = lastMoneyValue(await result.innerText());
    await addButton.click();
    await expect(result.getByText('Added to cart', { exact: true })).toBeVisible({
      timeout: 30_000,
    });
    return expectedTotal;
  }

  async proceedToCart(): Promise<void> {
    await this.page.getByRole('button', { name: /Proceed to Cart/ }).click();
    await expect(this.page).toHaveURL(/\/cart$/);
  }
}
