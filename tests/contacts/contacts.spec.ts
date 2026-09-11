import { expect, test } from '@playwright/test';
import { ContactsPage } from '../pages/contacts.page';
import { ContactDataBuilder } from '../support/contact-data.builder';

test.describe('Contacts CRUD', () => {
  test('creates a contact and persists its notification settings', async ({ page }) => {
    const contacts = new ContactsPage(page);
    const contact = new ContactDataBuilder().build();

    try {
      await contacts.create(contact);
      await expect(contacts.row(contact.name)).toContainText(contact.email);
      await contacts.openForEdit(contact.name);
      await contacts.expectFormValues(contact);
    } finally {
      await contacts.deleteIfPresent(contact.name);
    }
  });

  test('edits an existing contact', async ({ page }) => {
    const contacts = new ContactsPage(page);
    const original = new ContactDataBuilder()
      .with({
        allowSupportRequests: false,
        promotionalEmails: true,
        productEmails: false,
        financialEmails: false,
      })
      .build();
    const updated = {
      ...original,
      firstName: 'Updated',
      lastName: 'Contact',
      email: `updated.${Date.now()}@example.com`,
      comment: 'Updated by Playwright automated test',
      allowSupportRequests: true,
      promotionalEmails: false,
      productEmails: true,
      financialEmails: true,
    };

    try {
      await contacts.create(original);
      await contacts.edit(original.name, updated);
      await expect(contacts.row(updated.name)).toContainText(updated.email);
      await contacts.openForEdit(updated.name);
      await contacts.expectFormValues(updated);
    } finally {
      await contacts.deleteIfPresent(updated.name);
    }
  });

  test('deletes an existing non-default contact', async ({ page }) => {
    const contacts = new ContactsPage(page);
    const contact = new ContactDataBuilder().build();

    await contacts.create(contact);
    await contacts.delete(contact.name);
    await expect(contacts.row(contact.name)).toHaveCount(0);
    await expect(contacts.row('Primary')).toBeVisible();
    await expect(contacts.row('Abuse')).toBeVisible();
  });
});
