import { test, expect } from '@playwright/test';

test.describe('Landing Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('displays the app title', async ({ page }) => {
    await expect(
      page.getByRole('heading', { name: 'Clean Gmail' }),
    ).toBeVisible();
  });

  test('displays a description', async ({ page }) => {
    await expect(page.getByText(/analyze your gmail inbox/i)).toBeVisible();
  });

  test('displays the sign-in button', async ({ page }) => {
    await expect(
      page.getByRole('button', { name: 'Sign in with Google' }),
    ).toBeVisible();
  });

  test('sign-in button does not navigate away', async ({ page }) => {
    await page.getByRole('button', { name: 'Sign in with Google' }).click();
    await expect(page).toHaveURL('/');
  });

  test('is responsive at mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(
      page.getByRole('heading', { name: 'Clean Gmail' }),
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Sign in with Google' }),
    ).toBeVisible();
  });
});
