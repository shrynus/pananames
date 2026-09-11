import { expect, type Locator, type Page } from '@playwright/test';
import type { ContactData } from '../support/contact-data.builder';

const checkboxLabels = {
  allowSupportRequests:
    'Allow Support Requests (we will process any request for modification of domain names on this Company account made by this contact)',
  promotionalEmails: 'Send promotional emails (usually once a month)',
  productEmails: 'Send product emails (domain registrations, renewals, failures, etc.)',
  financialEmails: 'Send financial emails (balance notifications)',
} as const;

type CheckboxSetting = keyof typeof checkboxLabels;

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export class ContactsPage {
  constructor(private readonly page: Page) {}

  async goto(): Promise<void> {
    await this.page.goto('/contacts');
    await expect(this.page.getByRole('heading', { name: 'Contacts' })).toBeVisible();
    await expect(this.page.getByRole('row').filter({ hasText: 'Primary' })).toBeVisible();
  }

  row(name: string): Locator {
    return this.page
      .getByRole('row')
      .filter({ has: this.page.getByText(name, { exact: true }) });
  }

  async create(contact: ContactData): Promise<void> {
    await this.goto();
    await this.page.getByRole('button', { name: /Add New Contact/ }).click();
    await expect(this.page.getByRole('heading', { name: 'Create new contact' })).toBeVisible();
    await this.fill(contact, true);
    await this.submit('Create');
    await expect(this.row(contact.name)).toBeVisible();
  }

  async edit(existingName: string, contact: ContactData): Promise<void> {
    await this.goto();
    await this.clickRowAction(existingName, 'Edit');
    await expect(this.page.getByRole('heading', { name: 'Edit contact' })).toBeVisible();
    await expect(this.field('Contact type/NAME')).toHaveValue(existingName);
    await this.fill(contact, false);
    await this.submit('Save');
    await expect(this.row(contact.name)).toBeVisible();
  }

  async openForEdit(name: string): Promise<void> {
    await this.goto();
    await this.clickRowAction(name, 'Edit');
    await expect(this.page.getByRole('heading', { name: 'Edit contact' })).toBeVisible();
    await expect(this.field('Contact type/NAME')).toHaveValue(name);
  }

  async expectFormValues(contact: ContactData): Promise<void> {
    await expect(this.field('Contact type/NAME')).toHaveValue(contact.name);
    await expect(this.field('First Name')).toHaveValue(contact.firstName);
    await expect(this.field('Last Name')).toHaveValue(contact.lastName);
    await expect(this.field('Email')).toHaveValue(contact.email);
    await expect(this.field('Phone number')).toHaveValue(contact.phoneNumber);
    await expect(this.field('Comment (optional)')).toHaveValue(contact.comment);

    for (const setting of Object.keys(checkboxLabels) as CheckboxSetting[]) {
      await expect(this.checkbox(setting)).toBeChecked({ checked: contact[setting] });
    }
  }

  async delete(name: string): Promise<void> {
    await this.goto();
    const row = this.row(name);
    await this.clickRowAction(name, 'Delete');
    const dialog = this.page.getByRole('dialog');
    await expect(dialog).toContainText('Are you sure you want to delete this contact?');
    await dialog.getByRole('button', { name: 'OK' }).click();
    await expect(row).toHaveCount(0);
  }

  async deleteIfPresent(name: string): Promise<void> {
    await this.goto();
    if (await this.row(name).count()) {
      await this.delete(name);
    }
  }

  private field(label: string): Locator {
    return this.page
      .locator('label')
      .filter({ hasText: new RegExp(`^${escapeRegExp(label)}$`, 'i') })
      .locator('..')
      .locator('input');
  }

  private checkbox(setting: CheckboxSetting): Locator {
    return this.page.getByRole('checkbox', { name: checkboxLabels[setting] });
  }

  private async setCheckbox(setting: CheckboxSetting, checked: boolean): Promise<void> {
    const checkbox = this.checkbox(setting);
    if ((await checkbox.isChecked()) !== checked) {
      await this.page
        .locator('label')
        .filter({ hasText: new RegExp(`^${escapeRegExp(checkboxLabels[setting])}$`) })
        .click();
    }
    await expect(checkbox).toBeChecked({ checked });
  }

  private async fill(contact: ContactData, selectCountry: boolean): Promise<void> {
    await this.field('Contact type/NAME').fill(contact.name);
    await this.field('First Name').fill(contact.firstName);
    await this.field('Last Name').fill(contact.lastName);
    await this.field('Email').fill(contact.email);

    if (selectCountry) {
      // On create the empty widget exposes its input; edit keeps the existing prefix.
      await this.page.locator('input.country-intl-input').click();
      await this.page.getByText(contact.country, { exact: true }).click();
    }

    await this.field('Phone number').fill(contact.phoneNumber);
    await this.field('Comment (optional)').fill(contact.comment);

    for (const setting of Object.keys(checkboxLabels) as CheckboxSetting[]) {
      await this.setCheckbox(setting, contact[setting]);
    }
  }

  private async submit(buttonName: 'Create' | 'Save'): Promise<void> {
    const responsePromise = this.page.waitForResponse(
      (response) =>
        response.request().method() !== 'GET' && response.url().includes('/api/contacts/'),
    );

    await this.page.getByRole('button', { name: buttonName, exact: true }).click();
    const response = await responsePromise;
    const payload = (await response.json()) as { status?: boolean; error?: string };
    expect(payload.status, payload.error ?? `${buttonName} contact request failed`).toBe(true);
    await expect(this.page).toHaveURL(/\/contacts$/);
  }

  private async clickRowAction(name: string, columnTitle: 'Edit' | 'Delete'): Promise<void> {
    const headers = await this.page
      .locator('thead th')
      .evaluateAll((elements) => elements.map((element) => element.getAttribute('title')));
    const columnIndex = headers.indexOf(columnTitle);
    expect(columnIndex, `Column "${columnTitle}" was not found`).toBeGreaterThanOrEqual(0);
    await this.row(name).locator('td').nth(columnIndex).getByRole('button').click();
  }
}
