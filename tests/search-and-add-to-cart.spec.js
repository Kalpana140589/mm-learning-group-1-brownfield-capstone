const { test, expect } = require('@playwright/test');

test('Launch app, search product, add first result to cart', async ({ page }) => {
  // 1) Launch
  await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });

  // Basic smoke check: app rendered
  await expect(page).toHaveTitle(/ShopLite|Shop Lite|Shop/i);

  // 2) Perform product search
  // Prefer data-testid if present; otherwise fallback to common patterns.
  const searchInput = page.locator(
    '[data-testid="product-search"], input[placeholder*="Search"], input[type="search"]'
  ).first();

  await expect(searchInput).toBeVisible();
  await searchInput.fill('shirt');

  // Submit search (supports either Enter or a Search button)
  await Promise.race([
    searchInput.press('Enter'),
    page.locator('[data-testid="search-button"], button:has-text("Search")').first().click().catch(() => {})
  ]);

  // 3) Wait for results to update (grid/list/cards)
  const productCards = page.locator(
    '[data-testid="product-card"], .product-card, article:has(button:has-text("Add"))'
  );

  await expect(productCards.first()).toBeVisible({ timeout: 10000 });

  // 4) Add an item to cart
  // Try "Add to Cart" directly from card; otherwise open details then add.
  const firstCard = productCards.first();
  const addToCartFromCard = firstCard.locator(
    '[data-testid="add-to-cart"], button:has-text("Add to Cart"), button:has-text("Add")'
  ).first();

  // Capture cart count before (if your UI exposes it)
  const cartBadge = page.locator('[data-testid="cart-count"], .cart-badge, header a:has-text("Cart") >> .badge');
  const hadCartBadge = await cartBadge.first().isVisible().catch(() => false);
  const beforeCount = hadCartBadge ? parseInt((await cartBadge.first().innerText()).trim(), 10) : null;

  if (await addToCartFromCard.isVisible().catch(() => false)) {
    await addToCartFromCard.click();
  } else {
    // Fallback: click the product to open details
    await firstCard.click();
    const addToCartOnDetails = page.locator(
      '[data-testid="add-to-cart"], button:has-text("Add to Cart")'
    ).first();
    await expect(addToCartOnDetails).toBeVisible();
    await addToCartOnDetails.click();
  }

  // 5) Assert cart updated
  // Option A: cart count increments
  if (hadCartBadge && Number.isFinite(beforeCount)) {
    await expect(cartBadge.first()).toHaveText(String(beforeCount + 1), { timeout: 10000 });
  } else {
    // Option B: navigate to cart and verify at least one line item
    const cartLink = page.locator('[data-testid="cart-link"], a:has-text("Cart")').first();
    if (await cartLink.isVisible().catch(() => false)) {
      await cartLink.click();
    } else {
      await page.goto('http://localhost:3000/cart');
    }

    const cartItems = page.locator('[data-testid="cart-item"], .cart-item, li:has(button:has-text("Remove"))');
    await expect(cartItems.first()).toBeVisible({ timeout: 10000 });
  }
});