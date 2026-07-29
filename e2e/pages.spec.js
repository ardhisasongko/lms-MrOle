import { test, expect } from '@playwright/test';

const PUBLIC_PAGES = [
  { path: '/', name: 'landing' },
  { path: '/login', name: 'login' },
  { path: '/register', name: 'register' },
  { path: '/forgot-password', name: 'forgot-password' },
];

test.describe('Public pages - smoke test', () => {
  for (const { path, name } of PUBLIC_PAGES) {
    test(`${name} (${path}) loads without console errors`, async ({ page }) => {
      const consoleErrors = [];
      page.on('console', (msg) => {
        if (msg.type() === 'error') consoleErrors.push(msg.text());
      });
      page.on('pageerror', (err) => consoleErrors.push(err.message));

      await page.goto(path, { waitUntil: 'networkidle' });
      await expect(page).toHaveTitle(/LMS Mr\. Ole|Mr\. Ole|LMS/);
      const body = page.locator('body');
      await expect(body).toBeVisible();
      expect(consoleErrors).toEqual([]);
    });
  }
});

test.describe('Responsive layout checks', () => {
  test('landing page has no horizontal scroll on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/', { waitUntil: 'networkidle' });
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const viewportWidth = await page.evaluate(() => window.innerWidth);
    expect(scrollWidth).toBeLessThanOrEqual(viewportWidth + 1);
  });

  test('landing page has no horizontal scroll on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/', { waitUntil: 'networkidle' });
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const viewportWidth = await page.evaluate(() => window.innerWidth);
    expect(scrollWidth).toBeLessThanOrEqual(viewportWidth + 1);
  });
});

test.describe('Interactive elements', () => {
  test('login form is accessible and interactive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/login', { waitUntil: 'networkidle' });
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.getByRole('button', { name: /masuk|login|sign/i }).first()).toBeVisible();
  });

  test('login form is accessible and interactive on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/login', { waitUntil: 'networkidle' });
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.getByRole('button', { name: /masuk|login|sign/i }).first()).toBeVisible();
  });
});

test.describe('404 page', () => {
  test('nonexistent route shows 404 page', async ({ page }) => {
    await page.goto('/this-page-does-not-exist', { waitUntil: 'networkidle' });
    await expect(page.locator('body')).toBeVisible();
    const content = await page.textContent('body');
    expect(content).toMatch(/404|not found|tidak ditemukan/i);
  });
});
