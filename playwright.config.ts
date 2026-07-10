import { defineConfig, devices } from '@playwright/test';


export default defineConfig({
  // One Playwright project for the MahoCommerce demo only.
  testDir: './tests',
  testMatch: /mahocommerce.*\.spec\.ts/,
  // Demo storefront is unstable under heavy parallel load.
  fullyParallel: false,
  // Keep CI strict, but stay fast locally.
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : 1,
  // HTML report for review, list reporter for terminal feedback.
  reporter: [['html', { open: 'never' }], ['list']],
  use: {
    // Match a real desktop user session.
    ...devices['Desktop Chrome'],
    // Demo store base URL used by all tests.
    baseURL: 'https://demo.mahocommerce.com',
    // Capture evidence only when a retry fails.
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    // Protect every action from hanging too long.
    actionTimeout: 15_000,
  },
});
