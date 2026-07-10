import { Page, Locator, expect } from '@playwright/test';

export class CartPage {
  readonly page                    : Page;
  readonly cartLink                : Locator;
  readonly couponInput             : Locator;
  readonly applyCouponButton       : Locator;
  readonly discountRow             : Locator;
  readonly grandTotal              : Locator;
  readonly subtotal                : Locator;
  readonly couponErrorMessage      : Locator;
  readonly couponSuccessMessage    : Locator;
  readonly proceedToCheckoutButton : Locator;
  readonly quantityInput           : Locator;
  readonly updateCartButton        : Locator;
  readonly removeItemLink          : Locator;
  readonly cartRows                : Locator;
  readonly emptyCartHeading        : Locator;

  constructor(page: Page) {
    this.page = page;
    // Cart selectors are grouped here so test steps stay easy to read.
    this.cartLink                 = page.locator('a.skip-link, a[href*="checkout/cart"]').first();
    this.couponInput              =  page.locator('#coupon_code, input[name="coupon_code"], input[placeholder*="Discount" i]').first();
    this.applyCouponButton        = page.getByRole('button', { name: /apply coupon|apply/i }).first();
    this.discountRow              = page.locator('tr#discount, tr:has-text("Discount")');
    this.grandTotal               = page.locator('tr.grand_total .price, #cart-totals .grand_total .price, tr:has-text("Grand Total") .price').last();
    this.subtotal                 = page.locator('tr.subtotal .price, #cart-totals .subtotal .price, tr:has-text("Subtotal") .price').first();
    this.couponErrorMessage       = page.locator('.messages .error-msg, .validation-advice, div:has-text("is not valid"), div:has-text("invalid")').first();
    this.couponSuccessMessage     = page.locator('.messages .success-msg, .success-msg, div:has-text("was applied")').first();
    this.proceedToCheckoutButton  = page.getByRole('button', { name: /proceed to checkout/i }).or(page.getByRole('link', { name: /proceed to checkout/i })).first();
    this.quantityInput            = page.locator('input[title="Qty"], input[name*="cart" i]').first();
    this.updateCartButton         = page.getByRole('button', { name: /update shopping cart/i }).first();
    this.removeItemLink           = page.locator('#shopping-cart-table td.product-cart-remove a[title*="Remove" i], #shopping-cart-table td.product-cart-remove a:has-text("Remove")').first();
    this.cartRows                 = page.locator('#shopping-cart-table tbody tr');
    this.emptyCartHeading         = page.getByRole('heading', { name: /shopping cart is empty/i }).first();
  }

  async goToCart() {
    await this.page.goto('/checkout/cart/');
    await this.page.waitForLoadState('networkidle');
  }

  async getSubtotal(): Promise<number> {
    // Convert subtotal text into a number for assertions.
    const text = await this.subtotal.textContent();
    return parseFloat((text ?? '').replace(/[^0-9.]/g, ''));
  }

  async getGrandTotal(): Promise<number> {
    const text = await this.grandTotal.textContent();
    return parseFloat((text ?? '').replace(/[^0-9.]/g, ''));
  }

  async applyCoupon(code: string) {
    await this.couponInput.fill(code);
    await this.applyCouponButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  async assertCouponRejected() {
    await expect(this.couponErrorMessage).toBeVisible({ timeout: 10_000 });
  }

  async assertCouponApplied() {
    await expect(this.couponSuccessMessage).toBeVisible({ timeout: 10_000 });
  }

  async assertDiscountApplied() {
    await expect(this.discountRow).toBeVisible();
  }

  async proceedToCheckout() {
    // Continue from cart to checkout.
    await this.proceedToCheckoutButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  async updateQuantity(quantity: number) {
    // Change quantity and update totals.
    await this.quantityInput.fill(String(quantity));
    await this.updateCartButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  async removeItem() {
    // Remove the first item shown in cart.
    await this.removeItemLink.click();
    await this.page.waitForLoadState('networkidle');
  }

  async getCartItemCount(): Promise<number> {
    return this.cartRows.count();
  }

  async assertCartIsEmpty() {
    await expect(this.emptyCartHeading).toBeVisible({ timeout: 10_000 });
  }
}
