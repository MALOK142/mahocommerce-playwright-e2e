# ORIS Test Automation Challenge — Code Deliverable

Playwright + TypeScript project covering:
- **Task 2**: `tests/mahocommerce-checkout.spec.ts` — browse → sort → PDP → cart → checkout flow on https://demo.mahocommerce.com, plus search and checkout negative scenarios.

## Setup

```bash
npm install
npx playwright install --with-deps
```

## Run

```bash
npx playwright test                # run everything, headless
npx playwright test --headed        # watch it run
npx playwright show-report          # open the last HTML report (pass/fail, trace, screenshots)
```

## CI/CD

The suite is CI-ready via Playwright configuration (`forbidOnly`, retries/workers driven by `process.env.CI`).

## Notes for the interview

- I kept the MahoCommerce selectors inside `pages/*.ts` using a Page Object Model. This means that if the live UI changes, I usually only need to update the page objects, while the test flow in `tests/mahocommerce-checkout.spec.ts` stays readable and stable.
- I did not include coupon validation in the automated pass criteria because the public demo store does not provide a reliable valid promo code for repeatable testing.
