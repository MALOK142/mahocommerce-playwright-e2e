import { Page, Locator, expect } from '@playwright/test';


export class CategoryPage {
  readonly page         : Page;
  readonly sortBySelect : Locator;
  readonly productItems : Locator;
  readonly productPrices: Locator;
  readonly productNames : Locator;
  readonly searchInput  : Locator;
  readonly searchButton : Locator;

  constructor(page: Page) {
    this.page = page;
    // Catalog selectors live here, so tests stay simple.
    this.sortBySelect  = page.locator('#sort_by, select[title="Sort By"], .sort-by select').first();
    this.productItems  = page.locator('.category-products .item, .products-grid .item, .products-list .item');
    this.productPrices = page.locator(
      '.category-products .price, .products-grid .price, .products-list .price'
    );
    this.productNames = page.locator('.product-name a, h2.product-name a, .products-grid h2 a, .products-list h2 a');
    this.searchInput  = page.locator('#search, input[name="q"]').first();
    this.searchButton = page.getByRole('button', { name: /search/i }).first();
  }

  async searchFor(keyword: string) {
    // Start from home and search like a normal user.
    await this.page.goto('/');
    await this.searchInput.fill(keyword);
    await this.searchButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  async assertSearchReturnsResults() {
    // Search can open a list page or directly a product page.
    const searchResults = this.productNames.first();
    const pdpHeading    = this.page.locator('.product-shop .product-name, .product-name h1, .breadcrumbs strong').first();

    if (await searchResults.count()) {
      await expect(searchResults).toBeVisible({ timeout: 10_000 });
      return;
    }

    await expect(pdpHeading).toBeVisible({ timeout: 10_000 });
  }

  async openCategory(categoryLinkText: string) {
    // Sometimes a top menu opens a subcategory page first.
    await this.page.getByRole('link', { name: categoryLinkText, exact: false }).first().click();
    await this.page.waitForLoadState('networkidle');

    // If only subcategories are shown, open the first one.
    if ((await this.productItems.count()) === 0) {
      const firstSubcategory = this.page.locator(
        'main a[href*="/women/"], main a[href*="/men/"], main a[href*="/accessories/"]'
      ).first();

      if (await firstSubcategory.count()) {
        await firstSubcategory.click();
        await this.page.waitForLoadState('networkidle');
      }
    }
  }

  async sortByPriceAscending() {
    if ((await this.sortBySelect.count()) === 0) {
      return;
    }

    const options     = await this.sortBySelect.locator('option').allTextContents();
    const priceOption = options.find((o) => /price/i.test(o)) ?? 'Price';
    await this.sortBySelect.selectOption({ label: priceOption });
    await this.page.waitForLoadState('networkidle');
  }

  async getDisplayedPrices(): Promise<number[]> {
    const readPrices = async () => {
      const texts = await this.productPrices.allTextContents();
      return texts
        .map((t) => parseFloat(t.replace(/[^0-9.]/g, '')))
        .filter((n) => !Number.isNaN(n));
    };

    try {
      return await readPrices();
    } catch {
      await this.page.waitForLoadState('domcontentloaded');
      return await readPrices();
    }
  }

  async getDisplayedNames(): Promise<string[]> {
    const texts = await this.productNames.allTextContents();
    return texts.map((t) => t.trim()).filter(Boolean);
  }

  async getCatalogSnapshot(): Promise<{ prices: number[]; names: string[] }> {
    const prices = await this.getDisplayedPrices();
    const names = await this.getDisplayedNames();
    return { prices, names };
  }

  async assertAscendingOrder() {
    const prices = await this.getDisplayedPrices();
    if (prices.length < 2) {
      return;
    }
    const sorted = [...prices].sort((a, b) => a - b);
    expect(prices).toEqual(sorted);
  }

  async assertPriceSortAppliedAndReordered(before: { prices: number[]; names: string[] }) {
    const after  = await this.getCatalogSnapshot();
    const sorted = [...after.prices].sort((a, b) => a - b);
    expect(after.prices).toEqual(sorted);

    if (before.prices.length >= 3 && new Set(before.prices).size > 1) {
      expect(after.prices).not.toEqual(before.prices);
    }

    if (before.names.length >= 3) {
      expect(after.names).not.toEqual(before.names);
    }
  }

  async openFirstProduct() {
    if ((await this.productItems.count()) > 0) {
      await this.productItems.first().locator('a.product-image, h2 a, .product-name a, a').first().click();
    } else {
      await this.page.locator('main .products-grid a.product-image, main .products-list h2 a, main h2 a').first().click();
    }
    await this.page.waitForLoadState('networkidle');
  }
}
