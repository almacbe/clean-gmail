import { test, expect } from '@playwright/test';
import { setAuthCookie } from './helpers/auth';

const MOCK_ACCOUNT_STATUS = {
  emailAddress: 'testuser@gmail.com',
  messagesTotal: 12345,
  threadsTotal: 5678,
};

const MOCK_SCAN_RESPONSE = { emails: [] };

const MOCK_SUMMARY = {
  largeEmails: { count: 3, totalSizeBytes: 24_000_000 },
  promotions: { count: 120, totalSizeBytes: 15_000_000 },
  social: { count: 45, totalSizeBytes: 8_000_000 },
  oldEmails: { count: 200, totalSizeBytes: 50_000_000 },
};

async function setupDashboard(
  page: Parameters<Parameters<typeof test>[1]>[0],
  {
    summaryStatusCode = 200,
    summaryBody = MOCK_SUMMARY,
  }: {
    summaryStatusCode?: number;
    summaryBody?: object;
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
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(MOCK_SCAN_RESPONSE),
    });
  });

  await page.route('**/api/scan/promotions', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(MOCK_SCAN_RESPONSE),
    });
  });

  await page.route('**/api/scan/social', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(MOCK_SCAN_RESPONSE),
    });
  });

  await page.route('**/api/scan/old-emails**', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(MOCK_SCAN_RESPONSE),
    });
  });

  await page.route('**/api/scan/summary**', (route) => {
    route.fulfill({
      status: summaryStatusCode,
      contentType: 'application/json',
      body: JSON.stringify(
        summaryStatusCode === 200
          ? summaryBody
          : { error: 'Failed to fetch scan summary' },
      ),
    });
  });

  await setAuthCookie(page);
}

test.describe('Scan Summary Dashboard', () => {
  test('renders all 4 summary cards with correct data-testid attributes', async ({
    page,
  }) => {
    await setupDashboard(page);
    await page.goto('/dashboard');

    await expect(page.getByTestId('summary-card-large-emails')).toBeVisible();
    await expect(page.getByTestId('summary-card-promotions')).toBeVisible();
    await expect(page.getByTestId('summary-card-social')).toBeVisible();
    await expect(page.getByTestId('summary-card-old-emails')).toBeVisible();
  });

  test('cards show count and formatted size from mocked summary', async ({
    page,
  }) => {
    await setupDashboard(page);
    await page.goto('/dashboard');

    const largeCard = page.getByTestId('summary-card-large-emails');
    await expect(largeCard).toContainText('3');
    // 24 MB formatted
    await expect(largeCard).toContainText('MB');

    const promotionsCard = page.getByTestId('summary-card-promotions');
    await expect(promotionsCard).toContainText('120');

    const socialCard = page.getByTestId('summary-card-social');
    await expect(socialCard).toContainText('45');

    const oldEmailsCard = page.getByTestId('summary-card-old-emails');
    await expect(oldEmailsCard).toContainText('200');
  });

  test('clicking Large Emails card activates the large-emails tab', async ({
    page,
  }) => {
    await setupDashboard(page);
    await page.goto('/dashboard');

    await page.getByTestId('summary-card-large-emails').click();

    await expect(page.getByTestId('panel-large-emails')).toBeVisible();
  });

  test('clicking Promotions card activates the promotions tab', async ({
    page,
  }) => {
    await setupDashboard(page);
    await page.goto('/dashboard');

    await page.getByTestId('summary-card-promotions').click();

    await expect(page.getByTestId('panel-promotions')).toBeVisible();
    await expect(page.getByTestId('panel-large-emails')).not.toBeVisible();
  });

  test('clicking Social card activates the social tab', async ({ page }) => {
    await setupDashboard(page);
    await page.goto('/dashboard');

    await page.getByTestId('summary-card-social').click();

    await expect(page.getByTestId('panel-social')).toBeVisible();
    await expect(page.getByTestId('panel-large-emails')).not.toBeVisible();
  });

  test('clicking Old Emails card activates the old-emails tab', async ({
    page,
  }) => {
    await setupDashboard(page);
    await page.goto('/dashboard');

    await page.getByTestId('summary-card-old-emails').click();

    await expect(page.getByTestId('panel-old-emails')).toBeVisible();
    await expect(page.getByTestId('panel-large-emails')).not.toBeVisible();
  });

  test('error state — summary API returns 500 shows error alert', async ({
    page,
  }) => {
    await setupDashboard(page, { summaryStatusCode: 500 });
    await page.goto('/dashboard');

    await expect(page.getByTestId('summary-error')).toBeVisible();
    await expect(
      page.getByTestId('summary-card-large-emails'),
    ).not.toBeVisible();
  });

  test('mobile 375px: all 4 summary cards are visible', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await setupDashboard(page);
    await page.goto('/dashboard');

    await expect(page.getByTestId('summary-card-large-emails')).toBeVisible();
    await expect(page.getByTestId('summary-card-promotions')).toBeVisible();
    await expect(page.getByTestId('summary-card-social')).toBeVisible();
    await expect(page.getByTestId('summary-card-old-emails')).toBeVisible();
  });
});
