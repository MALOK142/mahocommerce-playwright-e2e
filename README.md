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

- MahoCommerce selectors are isolated in `pages/*.ts` (Page Object Model). If the live DOM differs from what's assumed here (category label, coupon code), only the page objects need adjusting — the test logic in `tests/mahocommerce-checkout.spec.ts` stays the same.
- Coupon assertions are intentionally excluded from automated pass criteria because no reliable valid promo code is available in the public demo environment.
