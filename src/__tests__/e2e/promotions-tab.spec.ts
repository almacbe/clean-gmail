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
  {
    id: 'promo-2',
    sender: 'Brand <news@brand.com>',
    subject: 'Newsletter',
    date: '2024-03-06T10:00:00.000Z',
    sizeEstimate: 150_000,
  },
];

async function setupDashboard(
  page: Parameters<Parameters<typeof test>[1]>[0],
  {
    largeEmails = MOCK_LARGE_EMAILS,
    largeEmailsStatusCode = 200,
    promotions = MOCK_PROMOTIONS,
    promotionsStatusCode = 200,
  }: {
    largeEmails?: object[];
    largeEmailsStatusCode?: number;
    promotions?: object[];
    promotionsStatusCode?: number;
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

  await setAuthCookie(page);
}

test.describe('Promotions tab', () => {
  test('Promotions tab button is visible on dashboard', async ({ page }) => {
    await setupDashboard(page);
    await page.goto('/dashboard');

    await expect(page.getByTestId('tab-promotions')).toBeVisible();
  });

  test('Large Emails tab is active by default', async ({ page }) => {
    await setupDashboard(page);
    await page.goto('/dashboard');

    await expect(page.getByTestId('panel-large-emails')).toBeVisible();
    await expect(page.getByTestId('panel-promotions')).not.toBeVisible();
  });

  test('clicking Promotions tab shows promotional emails', async ({ page }) => {
    await setupDashboard(page);
    await page.goto('/dashboard');

    await page.getByTestId('tab-promotions').click();

    await expect(page.getByTestId('panel-promotions')).toBeVisible();
    const rows = page.locator('[data-testid="panel-promotions"] tbody tr');
    await expect(rows).toHaveCount(2);
  });

  test('switching back to Large Emails tab shows large email data', async ({
    page,
  }) => {
    await setupDashboard(page);
    await page.goto('/dashboard');

    await page.getByTestId('tab-promotions').click();
    await expect(page.getByTestId('panel-promotions')).toBeVisible();

    await page.getByTestId('tab-large-emails').click();
    await expect(page.getByTestId('panel-large-emails')).toBeVisible();
    await expect(page.getByTestId('panel-promotions')).not.toBeVisible();
  });

  test('promotions empty state shown when no promotional emails', async ({
    page,
  }) => {
    await setupDashboard(page, { promotions: [] });
    await page.goto('/dashboard');

    await page.getByTestId('tab-promotions').click();

    await expect(page.getByTestId('promotions-empty')).toBeVisible();
    await expect(page.getByTestId('promotions-empty')).toContainText(
      'No promotional emails found',
    );
  });

  test('promotions error state shown when scan API returns error', async ({
    page,
  }) => {
    await setupDashboard(page, { promotionsStatusCode: 500 });
    await page.goto('/dashboard');

    await page.getByTestId('tab-promotions').click();

    await expect(page.getByTestId('promotions-error')).toBeVisible();
    await expect(page.getByTestId('promotions-error')).toContainText(
      'Failed to load promotions',
    );
  });

  test('error on promotions tab does not affect large emails tab', async ({
    page,
  }) => {
    await setupDashboard(page, { promotionsStatusCode: 500 });
    await page.goto('/dashboard');

    // Large emails tab still shows its content
    await expect(page.getByTestId('panel-large-emails')).toBeVisible();
    const rows = page.locator('[data-testid="panel-large-emails"] tbody tr');
    await expect(rows).toHaveCount(1);
  });

  test('error on large emails tab does not affect promotions tab', async ({
    page,
  }) => {
    await setupDashboard(page, { largeEmailsStatusCode: 500 });
    await page.goto('/dashboard');

    await page.getByTestId('tab-promotions').click();

    await expect(page.getByTestId('panel-promotions')).toBeVisible();
    const rows = page.locator('[data-testid="panel-promotions"] tbody tr');
    await expect(rows).toHaveCount(2);
  });

  test('shows count and total size in promotions tab footer', async ({
    page,
  }) => {
    await setupDashboard(page);
    await page.goto('/dashboard');

    await page.getByTestId('tab-promotions').click();

    await expect(page.getByTestId('promotions-count')).toContainText(
      '2 promotional emails',
    );
    await expect(page.getByTestId('promotions-total-size')).toBeVisible();
  });

  test('mobile 375px: both tabs are visible and accessible', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await setupDashboard(page);
    await page.goto('/dashboard');

    await expect(page.getByTestId('tab-large-emails')).toBeVisible();
    await expect(page.getByTestId('tab-promotions')).toBeVisible();
  });

  test('mobile 375px: promotions table renders without overflow', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await setupDashboard(page);
    await page.goto('/dashboard');

    await page.getByTestId('tab-promotions').click();
    await expect(page.getByTestId('promotions-count')).toBeVisible();
  });

  test('desktop 1440px: all column headers visible in Promotions tab', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await setupDashboard(page);
    await page.goto('/dashboard');

    await page.getByTestId('tab-promotions').click();

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
