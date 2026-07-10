import { Page, Locator, expect } from '@playwright/test';

export class ProductPage {
  readonly page               : Page;
  readonly productName        : Locator;
  readonly productPrice       : Locator;
  readonly productImage       : Locator;
  readonly addToCartButton    : Locator;
  readonly successMessage     : Locator;
  readonly requiredFieldErrors: Locator;
  readonly cartLink           : Locator;

  constructor(page: Page) {
    this.page = page;
    // Product page selectors used by the test flow.
    this.productName          = page.locator('.product-shop .product-name, .product-name h1, .breadcrumbs strong').first();
    this.productPrice         = page.locator('.product-shop .price, .price-box .price').first();
    this.productImage         = page.locator('.product-image img, #image-main').first();
    this.addToCartButton      = page.getByRole('button', { name: /add to cart/i });
    this.successMessage       = page.locator('.success-msg, .messages .success-msg');
    this.requiredFieldErrors  = page.locator('.validation-advice, .messages .error-msg');
    this.cartLink             = page.locator('a[href*="checkout/cart"]').first();
  }

  /** TC: verify the PDP shows consistent, non-empty product data */
  async assertProductDetailsAreDisplayed() {
    // A valid product page should show name, price, and image.
    const nameText = (await this.productName.first().textContent())?.trim() ?? '';
    expect(nameText.length).toBeGreaterThan(0);
    await expect(this.productPrice).toBeVisible();
    await expect(this.productImage).toBeVisible();
  }

  async getPrice(): Promise<number> {
    const text = await this.productPrice.first().textContent();
    return parseFloat((text ?? '').replace(/[^0-9.]/g, ''));
  }

  async addToCart() {
    // Pick required options first, then add the item to cart.
    await this.selectRequiredOptionsIfPresent();
    await this.addToCartButton.first().click();
    await this.page.waitForLoadState('networkidle');

    if ((await this.successMessage.count()) > 0) {
      await expect(this.successMessage.first()).toBeVisible({ timeout: 10_000 });
    }

    await expect(this.requiredFieldErrors.filter({ hasText: /required/i })).toHaveCount(0);

    // Small safety retry because this demo site may miss the first click.
    if (!(await this.hasHeaderCartCount())) {
      await this.addToCartButton.first().click({ force: true });
      await this.page.waitForLoadState('networkidle');
    }

    // Make sure cart count is visible before cart-dependent steps.
    await expect
      .poll(async () => this.hasHeaderCartCount(), { timeout: 10_000 })
      .toBe(true);
  }

  async addToCartWithoutSelectingRequiredOptions() {
    await this.addToCartButton.first().click();
    const validationError = this.requiredFieldErrors.first();
    await expect(validationError).toBeVisible({ timeout: 10_000 });
  }

  private async selectRequiredOptionsIfPresent() {
    // Most demo products require color and size.
    const firstColorOption = this.page.locator('dt:has-text("Color") + dd a, #configurable_swatch_color li a').first();
    const firstSizeOption  = this.page.locator('dt:has-text("Size") + dd a, #configurable_swatch_size li a').first();

    if (await firstColorOption.count()) {
      await firstColorOption.click();
    }

    if (await firstSizeOption.count()) {
      await firstSizeOption.click();
    }
  }

  private async hasHeaderCartCount(): Promise<boolean> {
    const cartText = (await this.cartLink.textContent()) ?? '';
    return /\d+/.test(cartText);
  }
}
