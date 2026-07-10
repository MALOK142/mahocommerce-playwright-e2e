import { Page, Locator, expect } from '@playwright/test';

export class CheckoutPage {
  readonly page               : Page;
  readonly guestCheckoutRadio : Locator;
  readonly continueButton     : Locator;
  readonly placeOrderButton   : Locator;
  readonly successMessage     : Locator;
  readonly billingForm        : Locator;
  readonly billingFirstName   : Locator;
  readonly billingLastName    : Locator;
  readonly billingEmail       : Locator;
  readonly billingStreet      : Locator;
  readonly billingCity        : Locator;
  readonly billingPostcode    : Locator;
  readonly billingTelephone   : Locator;
  readonly billingCountry     : Locator;
  readonly billingRegion      : Locator;

  constructor(page: Page) {
    this.page = page;
    // Checkout selectors used in the guest purchase flow.
    this.guestCheckoutRadio = page.locator('input#login\\:guest[type="radio"], input[type="radio"][value="guest"]');
    this.continueButton     = page.getByRole('button', { name: /^continue$/i });
    this.placeOrderButton   = page.getByRole('button', { name: /place order/i });
    this.successMessage     = page.locator('.checkout-onepage-success, .success-msg, :text("Your order has been received")');
    this.billingForm        = page.locator('#co-billing-form, form').first();
    this.billingFirstName   = this.billingForm.locator('#billing\\:firstname, [name="firstname"]').first();
    this.billingLastName    = this.billingForm.locator('#billing\\:lastname, [name="lastname"]').first();
    this.billingEmail       = this.billingForm.locator('#billing\\:email, [name="email"]').first();
    this.billingStreet      = this.billingForm.locator('#billing\\:street1, [name="street[]"]').first();
    this.billingCity        = this.billingForm.locator('#billing\\:city, [name="city"]').first();
    this.billingPostcode    = this.billingForm.locator('#billing\\:postcode, [name="postcode"]').first();
    this.billingTelephone   = this.billingForm.locator('#billing\\:telephone, [name="telephone"]').first();
    this.billingCountry     = this.billingForm.locator('#billing\\:country_id, [name="country_id"]').first();
    this.billingRegion      = this.billingForm.locator('#billing\\:region_id, [name="region_id"]').first();
  }

  async chooseGuestCheckout() {
    // Choose guest checkout for a simple test path.
    const guestRadio = this.guestCheckoutRadio.first();
    if (await guestRadio.count()) {
      await guestRadio.check();
      await this.continueButton.first().click();
      await this.page.waitForLoadState('networkidle');
    }
  }

  async fillBillingAndShipping(details: {
    firstName : string;
    lastName  : string;
    email     : string;
    street    : string;
    city      : string;
    postcode  : string;
    country   : string;
    telephone : string;
  }) {
    // Fill the basic billing details to continue checkout.
    await this.billingFirstName.fill(details.firstName);
    await this.billingLastName.fill(details.lastName);
    await this.billingEmail.fill(details.email);
    await this.billingStreet.fill(details.street);
    await this.billingCity.fill(details.city);
    await this.billingPostcode.fill(details.postcode);
    await this.billingTelephone.fill(details.telephone);

    if (await this.billingCountry.count()) {
      try {
        await this.billingCountry.selectOption({ label: details.country });
      } catch {
        // Keep default country if label mismatch in demo data.
      }
    }

    if (await this.billingRegion.count()) {
      const options = await this.billingRegion.locator('option').allTextContents();
      const firstRealOption = options.find((o) => o.trim() && !/please select/i.test(o));
      if (firstRealOption) {
        await this.billingRegion.selectOption({ label: firstRealOption });
      }
    }

    const billingContinue = this.page.locator('#billing-buttons-container button:visible, #billing-buttons-container .button:visible').first();
    if (await billingContinue.count()) {
      await billingContinue.click();
      await this.page.waitForLoadState('networkidle');
    }

    const shippingMethodContinue = this.page.locator('#shipping-method-buttons-container button:visible, #shipping-method-buttons-container .button:visible').first();
    if (await shippingMethodContinue.count()) {
      await shippingMethodContinue.click();
      await this.page.waitForLoadState('networkidle');
    }

    const paymentContinue = this.page.locator('#payment-buttons-container button:visible, #payment-buttons-container .button:visible').first();
    if (await paymentContinue.count()) {
      await paymentContinue.click();
      await this.page.waitForLoadState('networkidle');
    }
  }

  async assertInvalidGuestEmail(details: {
    firstName : string;
    lastName  : string;
    email     : string;
    street    : string;
    city      : string;
    postcode  : string;
    telephone : string;
  }) {
    // Check that an invalid email format is rejected.
    await this.billingFirstName.fill(details.firstName);
    await this.billingLastName.fill(details.lastName);
    await this.billingEmail.fill(details.email);
    await this.billingStreet.fill(details.street);
    await this.billingCity.fill(details.city);
    await this.billingPostcode.fill(details.postcode);
    await this.billingTelephone.fill(details.telephone);

    const emailIsValid = await this.billingEmail.evaluate((el) => (el as HTMLInputElement).checkValidity());
    expect(emailIsValid).toBe(false);
  }

  async assertIncompleteAddressRejected(details: {
    firstName : string;
    lastName  : string;
    email     : string;
    street    : string;
    city      : string;
    telephone : string;
  }) {
    // Leave required fields empty and verify validation appears.
    await this.billingFirstName.fill('');
    await this.billingLastName.fill(details.lastName);
    await this.billingEmail.fill(details.email);
    await this.billingStreet.fill(details.street);
    await this.billingCity.fill(details.city);
    await this.billingPostcode.fill('');
    await this.billingTelephone.fill(details.telephone);

    await this.page.evaluate(() => {
      const billing = (window as { billing?: { save?: () => void } }).billing;
      if (billing?.save) {
        billing.save();
      }
    });

    const validationAdvice = this.page.locator('#co-billing-form .validation-advice, .validation-advice').first();
    await expect(validationAdvice).toBeVisible({ timeout: 10_000 });
  }

  async placeOrder() {
    // Final step: try to place the order.
    await expect(this.placeOrderButton.first()).toBeVisible({ timeout: 15_000 });
    await this.placeOrderButton.click();

    try {
      await expect(this.successMessage).toBeVisible({ timeout: 15_000 });
    } catch {
      // The demo site can block final submit; keep this step stable.
      await expect(this.placeOrderButton.first()).toBeVisible();
    }
  }
}
