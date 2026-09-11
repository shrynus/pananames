export interface ContactData {
  name: string;
  firstName: string;
  lastName: string;
  email: string;
  country: string;
  phoneNumber: string;
  comment: string;
  allowSupportRequests: boolean;
  promotionalEmails: boolean;
  productEmails: boolean;
  financialEmails: boolean;
}

function lettersOnlyToken(): string {
  let value = BigInt(Date.now()) * 1_000n + BigInt(Math.floor(Math.random() * 1_000));
  let token = '';

  while (value > 0n) {
    token = String.fromCharCode(97 + Number(value % 26n)) + token;
    value /= 26n;
  }

  return token;
}

export class ContactDataBuilder {
  private readonly data: ContactData;

  constructor() {
    const token = lettersOnlyToken();
    this.data = {
      name: `QA ${token}`,
      firstName: 'Automation',
      lastName: 'Contact',
      email: `qa.${Date.now()}.${Math.floor(Math.random() * 10_000)}@example.com`,
      country: 'United Kingdom',
      phoneNumber: '2079460958',
      comment: 'Created by Playwright automated test',
      allowSupportRequests: true,
      promotionalEmails: false,
      productEmails: true,
      financialEmails: true,
    };
  }

  with(overrides: Partial<ContactData>): ContactDataBuilder {
    Object.assign(this.data, overrides);
    return this;
  }

  build(): ContactData {
    return { ...this.data };
  }
}

export function uniqueDomainLabel(): string {
  return `qa${lettersOnlyToken()}`.slice(0, 28);
}
