import { expect, test } from '@playwright/test';
import { CartPage } from '../pages/cart.page';
import { DomainRegistrationPage } from '../pages/domain-registration.page';
import { uniqueDomainLabel } from '../support/contact-data.builder';

const singleDomainZones = ['com', 'org', 'xyz'];

test.describe('Domain registration cart pricing', () => {
  test.beforeEach(async ({ page }) => {
    await new CartPage(page).clear();
  });

  test.afterEach(async ({ page }) => {
    await new CartPage(page).clear();
  });

  for (const zone of singleDomainZones) {
    test(`adds one .${zone} domain and keeps the displayed price`, async ({ page }) => {
      const registration = new DomainRegistrationPage(page);
      const cart = new CartPage(page);
      const domain = `${uniqueDomainLabel()}.${zone}`;

      await registration.goto();
      await registration.search(domain);
      const searchPrice = await registration.addToCart(domain);
      await registration.proceedToCart();

      expect(await cart.itemTotal(domain)).toBeCloseTo(searchPrice, 2);
      expect(await cart.total()).toBeCloseTo(searchPrice, 2);
    });
  }

  test('adds three available domains for an SLD and totals their prices', async ({ page }) => {
    const registration = new DomainRegistrationPage(page);
    const cart = new CartPage(page);
    const sld = uniqueDomainLabel();
    // These featured zones are present in the initial SLD-only result set.
    const domains = ['academy', 'actor', 'agency'].map((zone) => `${sld}.${zone}`);

    await registration.goto();
    await registration.search(sld);

    const searchPrices: number[] = [];
    for (const domain of domains) {
      searchPrices.push(await registration.addToCart(domain));
    }

    await registration.proceedToCart();
    const expectedTotal = searchPrices.reduce((sum, price) => sum + price, 0);

    await expect(cart.itemRow(domains[0])).toBeVisible();
    await expect(cart.itemRow(domains[1])).toBeVisible();
    await expect(cart.itemRow(domains[2])).toBeVisible();
    expect(await cart.total()).toBeCloseTo(expectedTotal, 2);
  });
});
