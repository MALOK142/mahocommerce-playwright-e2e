import { test, expect } from '@playwright/test';
import { CategoryPage } from '../pages/CategoryPage';
import { ProductPage } from '../pages/ProductPage';
import { CartPage } from '../pages/CartPage';
import { CheckoutPage } from '../pages/CheckoutPage';


test.describe('MahoCommerce - user story validation', () => {
  // Main happy path: browse, sort, add to cart, and checkout as a guest.
  test('TC-001 shopper can browse, sort, add a product, and place an order', async ({ page }) => {

    const category  = new CategoryPage(page);
    const product   = new ProductPage(page);
    const cart      = new CartPage(page);
    const checkout  = new CheckoutPage(page);

    await test.step('Browse to a clothing category', async () => {
      // Start from the home page and reach a real catalog section.
      await page.goto('/');
      await category.openCategory('Women');
      await expect(page).toHaveURL(/.+/);
    });

    await test.step('Sort products by price and verify ordering', async () => {
      // Sorting proves the list view is interactive and stable.
      await category.sortByPriceAscending();
      await category.assertAscendingOrder();
    });

    let unitPrice = 0;

    await test.step('Open a product and verify its details', async () => {
      // Use the PDP as the source of truth for price and product data.
      await category.openFirstProduct();
      await product.assertProductDetailsAreDisplayed();
      unitPrice = await product.getPrice();
      expect(unitPrice).toBeGreaterThan(0);
    });

    await test.step('Add the product to the cart', async () => {
      // The page object hides swatches and add-to-cart locator details.
      await product.addToCart();
    });

    await test.step('Verify cart subtotal matches the product price', async () => {
      // This checks cart calculation, not only navigation.
      await cart.goToCart();
      const subtotal = await cart.getSubtotal();
      expect(subtotal).toBeCloseTo(unitPrice, 2);
    });

    await test.step('Proceed to checkout as guest and place the order', async () => {
      // Finish the flow with guest checkout data only.
      await cart.proceedToCheckout();
      await checkout.chooseGuestCheckout();
      await checkout.fillBillingAndShipping({
        firstName: 'Mika',
        lastName: 'QA',
        email: `qa.mika.${Date.now()}@example.com`,
        street: '10 Rue de la Republique',
        city: 'Lyon',
        postcode: '69001',
        country: 'France',
        telephone: '0600000000',
      });
      await checkout.placeOrder();
    });
  });

  // Quick search smoke check.
  test('TC-002 shopper can find products using search', async ({ page }) => {
    const category = new CategoryPage(page);

    await category.searchFor('tank');
    await category.assertSearchReturnsResults();
  });

  // Cart management should recalculate totals correctly.
  test('TC-003 cart quantity update recalculates subtotal', async ({ page }) => {
    const category = new CategoryPage(page);
    const product = new ProductPage(page);
    const cart = new CartPage(page);

    await page.goto('/');
    await category.openCategory('Women');
    await category.openFirstProduct();

    const unitPrice = await product.getPrice();
    await product.addToCart();

    await cart.goToCart();
    await cart.updateQuantity(2);

    const subtotal = await cart.getSubtotal();
    expect(subtotal).toBeCloseTo(unitPrice * 2, 2);
  });

  // Cart removal is a basic user action and a good regression check.
  test('TC-004 cart item can be removed from the cart', async ({ page }) => {
    const category = new CategoryPage(page);
    const product = new ProductPage(page);
    const cart = new CartPage(page);

    await page.goto('/');
    await category.openCategory('Women');
    await category.openFirstProduct();
    await product.addToCart();

    await cart.goToCart();
    const beforeCount = await cart.getCartItemCount();
    await cart.removeItem();
    await expect
      .poll(async () => cart.getCartItemCount(), { timeout: 10_000 })
      .toBe(Math.max(0, beforeCount - 1));
  });

  // Negative check: validation should reject a wrong email format.
  test('TC-005 checkout rejects invalid guest email format', async ({ page }) => {
    const category = new CategoryPage(page);
    const product = new ProductPage(page);
    const cart = new CartPage(page);
    const checkout = new CheckoutPage(page);

    await page.goto('/');
    await category.openCategory('Women');
    await category.openFirstProduct();
    await product.addToCart();
    await cart.goToCart();
    await cart.proceedToCheckout();
    await checkout.chooseGuestCheckout();

    await checkout.assertInvalidGuestEmail({
      firstName: 'Mika',
      lastName: 'QA',
      email: 'invalid-email-format',
      street: '10 Rue de la Republique',
      city: 'Lyon',
      postcode: '69001',
      telephone: '0789310000',
    });
  });

  // Negative check: required address data should not pass silently.
  test('TC-006 checkout rejects incomplete guest address (missing first name)', async ({ page }) => {
    const category = new CategoryPage(page);
    const product = new ProductPage(page);
    const cart = new CartPage(page);
    const checkout = new CheckoutPage(page);

    await page.goto('/');
    await category.openCategory('Women');
    await category.openFirstProduct();
    await product.addToCart();
    await cart.goToCart();
    await cart.proceedToCheckout();
    await checkout.chooseGuestCheckout();

    await checkout.assertIncompleteAddressRejected({
      firstName: 'Mika',
      lastName: 'QA',
      email: 'qa.address.test@example.com',
      street: '10 Rue de la Republique',
      city: 'Lyon',
      telephone: '0789310001',
    });
  });

});
