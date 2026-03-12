import { test, expect } from '@playwright/test';

const MOCK_ACCOUNT_STATUS = {
  emailAddress: 'testuser@gmail.com',
  messagesTotal: 12345,
  threadsTotal: 5678,
};

// Helper: mock the account-status API and mock auth session
async function setupAuthenticatedDashboard(
  page: Parameters<Parameters<typeof test>[1]>[0],
  {
    statusCode = 200,
    responseBody = MOCK_ACCOUNT_STATUS,
  }: { statusCode?: number; responseBody?: object } = {},
) {
  // Mock the account-status API route
  await page.route('**/api/account-status', (route) => {
    route.fulfill({
      status: statusCode,
      contentType: 'application/json',
      body: JSON.stringify(responseBody),
    });
  });

  // Mock the NextAuth session endpoint so the dashboard thinks user is signed in
  await page.route('**/api/auth/session', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        user: {
          name: 'Test User',
          email: 'testuser@gmail.com',
          image: null,
        },
        expires: '2099-01-01T00:00:00.000Z',
      }),
    });
  });
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
    await expect(page.getByRole('alert')).toBeVisible();
    await expect(page.getByRole('alert')).toContainText(
      'Failed to fetch account status',
    );
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
