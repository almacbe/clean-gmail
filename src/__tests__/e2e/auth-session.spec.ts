import { test, expect } from '@playwright/test';

test.describe('Auth session redirect behavior', () => {
  test('unauthenticated visit to /dashboard redirects to /', async ({
    page,
  }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL('/');
  });

  test('landing page shows sign-in button when unauthenticated', async ({
    page,
  }) => {
    await page.goto('/');
    await expect(
      page.getByRole('button', { name: 'Sign in with Google' }),
    ).toBeVisible();
  });
});
