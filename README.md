# Pananames Playwright tests

End-to-end coverage for contact CRUD and domain-cart price calculations in the Pananames dev environment.

## Prerequisites

- Node.js 20+
- Access to `https://mcp.pananames-dev.com`
- A valid test account

## Install

```bash
npm install
npx playwright install --with-deps chromium
```

## Configure

Copy `.env.example` to `.env` and provide the test credentials:

```dotenv
BASE_URL=https://mcp.pananames-dev.com
TEST_USER_EMAIL=your-email
TEST_USER_PASSWORD=your-password
```

If 2FA is enabled for the account, also set `TEST_USER_2FA`.

The real `.env` and generated authentication state are ignored by git.

## Run

```bash
npm test
npm run test:contacts
npm run test:domains
npm run test:headed
npm run test:ui
```

Static TypeScript validation:

```bash
npm run typecheck
```

Open the latest HTML report:

```bash
npm run report
```

The suite intentionally uses one worker because contacts and the shopping cart are shared mutable account state. Every test owns unique data; non-default contacts and cart items are removed during teardown. Primary and Abuse contacts are never deleted.

On failure, Playwright keeps the trace, screenshot, and video in `test-results/`.
