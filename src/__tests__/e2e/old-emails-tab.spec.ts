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
];

const MOCK_OLD_EMAILS = [
  {
    id: 'old-1',
    sender: 'Newsletter <newsletter@example.com>',
    subject: 'Old newsletter',
    date: '2019-01-15T08:00:00.000Z',
    sizeEstimate: 500_000,
  },
  {
    id: 'old-2',
    sender: 'Archive <archive@example.com>',
    subject: 'Ancient message',
    date: '2018-06-20T14:00:00.000Z',
    sizeEstimate: 300_000,
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
    oldEmails = MOCK_OLD_EMAILS,
    oldEmailsStatusCode = 200,
  }: {
    largeEmails?: object[];
    largeEmailsStatusCode?: number;
    promotions?: object[];
    promotionsStatusCode?: number;
    social?: object[];
    socialStatusCode?: number;
    oldEmails?: object[];
    oldEmailsStatusCode?: number;
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

  await page.route('**/api/scan/old-emails**', (route) => {
    route.fulfill({
      status: oldEmailsStatusCode,
      contentType: 'application/json',
      body: JSON.stringify(
        oldEmailsStatusCode === 200
          ? { emails: oldEmails }
          : { error: 'Scan failed' },
      ),
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

test.describe('Old Emails tab', () => {
  test('Old Emails tab button is visible on dashboard', async ({ page }) => {
    await setupDashboard(page);
    await page.goto('/dashboard');

    await expect(page.getByTestId('tab-old-emails')).toBeVisible();
  });

  test('Large Emails tab is still active by default (not old-emails)', async ({
    page,
  }) => {
    await setupDashboard(page);
    await page.goto('/dashboard');

    await expect(page.getByTestId('panel-large-emails')).toBeVisible();
    await expect(page.getByTestId('panel-old-emails')).not.toBeVisible();
  });

  test('clicking Old Emails tab shows the panel', async ({ page }) => {
    await setupDashboard(page);
    await page.goto('/dashboard');

    await page.getByTestId('tab-old-emails').click();

    await expect(page.getByTestId('panel-old-emails')).toBeVisible();
  });

  test('default threshold fetches with ?olderThan=1y', async ({ page }) => {
    const requestUrls: string[] = [];

    await setupDashboard(page);
    page.on('request', (req) => {
      if (req.url().includes('/api/scan/old-emails')) {
        requestUrls.push(req.url());
      }
    });

    await page.goto('/dashboard');
    await Promise.all([
      page.waitForResponse((res) => res.url().includes('/api/scan/old-emails')),
      page.getByTestId('tab-old-emails').click(),
    ]);

    expect(requestUrls.some((url) => url.includes('olderThan=1y'))).toBe(true);
  });

  test('age dropdown has 4 options (6 months, 1 year, 2 years, 5 years)', async ({
    page,
  }) => {
    await setupDashboard(page);
    await page.goto('/dashboard');

    await page.getByTestId('tab-old-emails').click();
    await expect(page.getByTestId('panel-old-emails')).toBeVisible();

    const select = page.locator('[data-testid="panel-old-emails"] select');
    const options = await select.locator('option').all();

    expect(options).toHaveLength(4);

    const texts = await Promise.all(options.map((o) => o.textContent()));
    expect(texts).toContain('6 months');
    expect(texts).toContain('1 year');
    expect(texts).toContain('2 years');
    expect(texts).toContain('5 years');
  });

  test('changing dropdown to "2 years" triggers re-fetch with ?olderThan=2y', async ({
    page,
  }) => {
    const requestUrls: string[] = [];

    await setupDashboard(page);
    page.on('request', (req) => {
      if (req.url().includes('/api/scan/old-emails')) {
        requestUrls.push(req.url());
      }
    });

    await page.goto('/dashboard');
    await Promise.all([
      page.waitForResponse((res) => res.url().includes('/api/scan/old-emails')),
      page.getByTestId('tab-old-emails').click(),
    ]);

    const select = page.locator('[data-testid="panel-old-emails"] select');
    await Promise.all([
      page.waitForResponse((res) => res.url().includes('olderThan=2y')),
      select.selectOption('2y'),
    ]);

    expect(requestUrls.some((url) => url.includes('olderThan=2y'))).toBe(true);
  });

  test('table rows render correctly with mocked data', async ({ page }) => {
    await setupDashboard(page);
    await page.goto('/dashboard');

    await Promise.all([
      page.waitForResponse((res) => res.url().includes('/api/scan/old-emails')),
      page.getByTestId('tab-old-emails').click(),
    ]);

    const rows = page.locator('[data-testid="panel-old-emails"] tbody tr');
    await expect(rows).toHaveCount(2);
  });

  test('empty state shown when no old emails', async ({ page }) => {
    await setupDashboard(page, { oldEmails: [] });
    await page.goto('/dashboard');

    await Promise.all([
      page.waitForResponse((res) => res.url().includes('/api/scan/old-emails')),
      page.getByTestId('tab-old-emails').click(),
    ]);

    await expect(page.getByTestId('old-emails-empty')).toBeVisible();
  });

  test('error state shown when API returns 500', async ({ page }) => {
    await setupDashboard(page, { oldEmailsStatusCode: 500 });
    await page.goto('/dashboard');

    await Promise.all([
      page.waitForResponse((res) => res.url().includes('/api/scan/old-emails')),
      page.getByTestId('tab-old-emails').click(),
    ]);

    await expect(page.getByTestId('old-emails-error')).toBeVisible();
  });

  test('mobile 375px: tab and dropdown visible', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await setupDashboard(page);
    await page.goto('/dashboard');

    await expect(page.getByTestId('tab-old-emails')).toBeVisible();

    await page.getByTestId('tab-old-emails').click();
    await expect(
      page.locator('[data-testid="panel-old-emails"] select'),
    ).toBeVisible();
  });

  test('desktop 1440px: column headers visible', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await setupDashboard(page);
    await page.goto('/dashboard');

    await Promise.all([
      page.waitForResponse((res) => res.url().includes('/api/scan/old-emails')),
      page.getByTestId('tab-old-emails').click(),
    ]);

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
