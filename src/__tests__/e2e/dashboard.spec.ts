import { test, expect } from '@playwright/test';
import { setAuthCookie } from './helpers/auth';

const MOCK_ACCOUNT_STATUS = {
  emailAddress: 'testuser@gmail.com',
  messagesTotal: 12345,
  threadsTotal: 5678,
};

const MOCK_SCAN_RESPONSE = { emails: [] };

// Helper: mock both API routes and auth session
async function setupAuthenticatedDashboard(
  page: Parameters<Parameters<typeof test>[1]>[0],
  {
    statusCode = 200,
    responseBody = MOCK_ACCOUNT_STATUS,
    scanStatusCode = 200,
    scanResponseBody = MOCK_SCAN_RESPONSE,
  }: {
    statusCode?: number;
    responseBody?: object;
    scanStatusCode?: number;
    scanResponseBody?: object;
  } = {},
) {
  // Mock the account-status API route
  await page.route('**/api/account-status', (route) => {
    route.fulfill({
      status: statusCode,
      contentType: 'application/json',
      body: JSON.stringify(responseBody),
    });
  });

  // Mock the scan/large-emails API route
  await page.route('**/api/scan/large-emails', (route) => {
    route.fulfill({
      status: scanStatusCode,
      contentType: 'application/json',
      body: JSON.stringify(scanResponseBody),
    });
  });

  // Mock the scan/promotions API route
  await page.route('**/api/scan/promotions', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ emails: [] }),
    });
  });

  // Mock the scan/social API route
  await page.route('**/api/scan/social', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ emails: [] }),
    });
  });

  // Mock the scan/old-emails API route
  await page.route('**/api/scan/old-emails**', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ emails: [] }),
    });
  });

  // Mock the scan/summary API route
  await page.route('**/api/scan/summary**', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        largeEmails: { count: 0, totalSizeBytes: 0 },
        promotions: { count: 0, totalSizeBytes: 0 },
        social: { count: 0, totalSizeBytes: 0 },
        oldEmails: { count: 0, totalSizeBytes: 0 },
      }),
    });
  });

  // Set a real NextAuth session cookie so server-side auth() treats the request as authenticated
  await setAuthCookie(page);
}

test.describe('Dashboard page', () => {
  test('unauthenticated visit to /dashboard redirects to /', async ({
    page,
  }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL('/');
  });

  test('shows email address when API returns valid data', async ({ page }) => {
    await setupAuthenticatedDashboard(page);
    await page.goto('/dashboard');
    await expect(page.getByText('testuser@gmail.com')).toBeVisible();
  });

  test('shows message count when API returns valid data', async ({ page }) => {
    await setupAuthenticatedDashboard(page);
    await page.goto('/dashboard');
    await expect(page.getByTestId('messages-total')).toBeVisible();
    await expect(page.getByTestId('messages-total')).toContainText('12,345');
  });

  test('shows thread count when API returns valid data', async ({ page }) => {
    await setupAuthenticatedDashboard(page);
    await page.goto('/dashboard');
    await expect(page.getByTestId('threads-total')).toBeVisible();
    await expect(page.getByTestId('threads-total')).toContainText('5,678');
  });

  test('shows sign-out button in header', async ({ page }) => {
    await setupAuthenticatedDashboard(page);
    await page.goto('/dashboard');
    await expect(page.getByRole('button', { name: 'Sign Out' })).toBeVisible();
  });

  test('sign-out button returns to landing page', async ({ page }) => {
    await setupAuthenticatedDashboard(page);
    await page.goto('/dashboard');

    // Mock signOut redirect
    await page.route('**/api/auth/signout', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ url: '/' }),
      });
    });

    await page.getByRole('button', { name: 'Sign Out' }).click();
    // After sign-out NextAuth redirects to callbackUrl ("/")
    await expect(page).toHaveURL('/');
  });

  test('shows error banner when API returns 500', async ({ page }) => {
    await setupAuthenticatedDashboard(page, {
      statusCode: 500,
      responseBody: { error: 'Internal Server Error' },
    });
    await page.goto('/dashboard');
    const accountAlert = page
      .getByRole('alert')
      .filter({ hasText: 'Failed to fetch account status' });
    await expect(accountAlert).toBeVisible();
  });

  test('mobile 375px: stats are visible', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await setupAuthenticatedDashboard(page);
    await page.goto('/dashboard');
    await expect(page.getByTestId('messages-total')).toBeVisible();
    await expect(page.getByTestId('threads-total')).toBeVisible();
  });

  test('desktop 1440px: stats are visible in a row', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await setupAuthenticatedDashboard(page);
    await page.goto('/dashboard');
    await expect(page.getByTestId('messages-total')).toBeVisible();
    await expect(page.getByTestId('threads-total')).toBeVisible();
  });
});
