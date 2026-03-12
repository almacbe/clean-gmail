import { test, expect } from '@playwright/test';
import { setAuthCookie } from './helpers/auth';

const MOCK_ACCOUNT_STATUS = {
  emailAddress: 'testuser@gmail.com',
  messagesTotal: 12345,
  threadsTotal: 5678,
};

const MOCK_LARGE_EMAILS = [
  {
    id: 'large-1',
    sender: 'Alice <alice@example.com>',
    subject: 'Big attachment',
    date: '2024-03-01T10:00:00.000Z',
    sizeEstimate: 10_000_000,
  },
];

const MOCK_PROMOTIONS = [
  {
    id: 'promo-1',
    sender: 'Shop <promo@shop.com>',
    subject: 'Sale today!',
    date: '2024-03-05T09:00:00.000Z',
    sizeEstimate: 200_000,
  },
];

const MOCK_SOCIAL = [
  {
    id: 'social-1',
    sender: 'Twitter <twitter@twitter.com>',
    subject: 'New follower',
    date: '2024-03-07T11:00:00.000Z',
    sizeEstimate: 180_000,
  },
  {
    id: 'social-2',
    sender: 'LinkedIn <linkedin@linkedin.com>',
    subject: 'Connection request',
    date: '2024-03-08T14:00:00.000Z',
    sizeEstimate: 120_000,
  },
];

async function setupDashboard(
  page: Parameters<Parameters<typeof test>[1]>[0],
  {
    largeEmails = MOCK_LARGE_EMAILS,
    largeEmailsStatusCode = 200,
    promotions = MOCK_PROMOTIONS,
    promotionsStatusCode = 200,
    social = MOCK_SOCIAL,
    socialStatusCode = 200,
  }: {
    largeEmails?: object[];
    largeEmailsStatusCode?: number;
    promotions?: object[];
    promotionsStatusCode?: number;
    social?: object[];
    socialStatusCode?: number;
  } = {},
) {
  await page.route('**/api/account-status', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(MOCK_ACCOUNT_STATUS),
    });
  });

  await page.route('**/api/scan/large-emails', (route) => {
    route.fulfill({
      status: largeEmailsStatusCode,
      contentType: 'application/json',
      body: JSON.stringify(
        largeEmailsStatusCode === 200
          ? { emails: largeEmails }
          : { error: 'Scan failed' },
      ),
    });
  });

  await page.route('**/api/scan/promotions', (route) => {
    route.fulfill({
      status: promotionsStatusCode,
      contentType: 'application/json',
      body: JSON.stringify(
        promotionsStatusCode === 200
          ? { emails: promotions }
          : { error: 'Scan failed' },
      ),
    });
  });

  await page.route('**/api/scan/social', (route) => {
    route.fulfill({
      status: socialStatusCode,
      contentType: 'application/json',
      body: JSON.stringify(
        socialStatusCode === 200
          ? { emails: social }
          : { error: 'Scan failed' },
      ),
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

  await setAuthCookie(page);
}

test.describe('Social tab', () => {
  test('Social tab button is visible on dashboard', async ({ page }) => {
    await setupDashboard(page);
    await page.goto('/dashboard');

    await expect(page.getByTestId('tab-social')).toBeVisible();
  });

  test('Large Emails tab is active by default', async ({ page }) => {
    await setupDashboard(page);
    await page.goto('/dashboard');

    await expect(page.getByTestId('panel-large-emails')).toBeVisible();
    await expect(page.getByTestId('panel-social')).not.toBeVisible();
  });

  test('clicking Social tab shows social emails', async ({ page }) => {
    await setupDashboard(page);
    await page.goto('/dashboard');

    await page.getByTestId('tab-social').click();

    await expect(page.getByTestId('panel-social')).toBeVisible();
    const rows = page.locator('[data-testid="panel-social"] tbody tr');
    await expect(rows).toHaveCount(2);
  });

  test('switching back to Large Emails tab shows large email data', async ({
    page,
  }) => {
    await setupDashboard(page);
    await page.goto('/dashboard');

    await page.getByTestId('tab-social').click();
    await expect(page.getByTestId('panel-social')).toBeVisible();

    await page.getByTestId('tab-large-emails').click();
    await expect(page.getByTestId('panel-large-emails')).toBeVisible();
    await expect(page.getByTestId('panel-social')).not.toBeVisible();
  });

  test('social empty state shown when no social emails', async ({ page }) => {
    await setupDashboard(page, { social: [] });
    await page.goto('/dashboard');

    await page.getByTestId('tab-social').click();

    await expect(page.getByTestId('social-empty')).toBeVisible();
    await expect(page.getByTestId('social-empty')).toContainText(
      'No social emails found',
    );
  });

  test('social error state shown when scan API returns error', async ({
    page,
  }) => {
    await setupDashboard(page, { socialStatusCode: 500 });
    await page.goto('/dashboard');

    await page.getByTestId('tab-social').click();

    await expect(page.getByTestId('social-error')).toBeVisible();
    await expect(page.getByTestId('social-error')).toContainText(
      'Failed to load social emails',
    );
  });

  test('error on social tab does not affect large emails tab', async ({
    page,
  }) => {
    await setupDashboard(page, { socialStatusCode: 500 });
    await page.goto('/dashboard');

    // Large emails tab still shows its content
    await expect(page.getByTestId('panel-large-emails')).toBeVisible();
    const rows = page.locator('[data-testid="panel-large-emails"] tbody tr');
    await expect(rows).toHaveCount(1);
  });

  test('shows count and total size in social tab footer', async ({ page }) => {
    await setupDashboard(page);
    await page.goto('/dashboard');

    await page.getByTestId('tab-social').click();

    await expect(page.getByTestId('social-count')).toContainText(
      '2 social emails',
    );
    await expect(page.getByTestId('social-total-size')).toBeVisible();
  });

  test('mobile 375px: social tab is visible and accessible', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await setupDashboard(page);
    await page.goto('/dashboard');

    await expect(page.getByTestId('tab-social')).toBeVisible();
  });

  test('mobile 375px: social table renders without overflow', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await setupDashboard(page);
    await page.goto('/dashboard');

    await page.getByTestId('tab-social').click();
    await expect(page.getByTestId('social-count')).toBeVisible();
  });

  test('desktop 1440px: all column headers visible in Social tab', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await setupDashboard(page);
    await page.goto('/dashboard');

    await page.getByTestId('tab-social').click();

    await expect(
      page.getByRole('columnheader', { name: 'Sender' }),
    ).toBeVisible();
    await expect(
      page.getByRole('columnheader', { name: 'Subject' }),
    ).toBeVisible();
    await expect(
      page.getByRole('columnheader', { name: 'Date' }),
    ).toBeVisible();
    await expect(
      page.getByRole('columnheader', { name: 'Size' }),
    ).toBeVisible();
  });
});
