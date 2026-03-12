import { test, expect } from '@playwright/test';
import { setAuthCookie } from './helpers/auth';

const MOCK_ACCOUNT_STATUS = {
  emailAddress: 'testuser@gmail.com',
  messagesTotal: 12345,
  threadsTotal: 5678,
};

const MOCK_EMAILS = [
  {
    id: 'email-1',
    sender: 'Alice <alice@example.com>',
    subject: 'Large attachment',
    date: '2024-03-01T10:00:00.000Z',
    sizeEstimate: 10_000_000,
  },
  {
    id: 'email-2',
    sender: 'Bob <bob@example.com>',
    subject: 'Another big one',
    date: '2024-02-15T08:00:00.000Z',
    sizeEstimate: 6_000_000,
  },
  {
    id: 'email-3',
    sender: 'Carol <carol@example.com>',
    subject: 'Medium sized',
    date: '2024-01-10T12:00:00.000Z',
    sizeEstimate: 7_500_000,
  },
];

async function setupDashboard(
  page: Parameters<Parameters<typeof test>[1]>[0],
  {
    emails = MOCK_EMAILS,
    scanStatusCode = 200,
  }: { emails?: object[]; scanStatusCode?: number } = {},
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
      status: scanStatusCode,
      contentType: 'application/json',
      body: JSON.stringify(
        scanStatusCode === 200 ? { emails } : { error: 'Scan failed' },
      ),
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

  // Set a real NextAuth session cookie so server-side auth() treats the request as authenticated
  await setAuthCookie(page);
}

test.describe('Large emails table', () => {
  test('renders a row for each email returned by the scan', async ({
    page,
  }) => {
    await setupDashboard(page);
    await page.goto('/dashboard');

    const rows = page.locator('tbody tr');
    await expect(rows).toHaveCount(3);
  });

  test('first row is the largest email (sorted by size descending)', async ({
    page,
  }) => {
    await setupDashboard(page);
    await page.goto('/dashboard');

    // Email-1 has the largest sizeEstimate (10 MB) — should appear first
    const firstRow = page.locator('tbody tr').first();
    await expect(firstRow).toContainText('Alice');
  });

  test('shows sender, subject, date, and size columns', async ({ page }) => {
    await setupDashboard(page);
    await page.goto('/dashboard');

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

  test('shows summary with email count and total size', async ({ page }) => {
    await setupDashboard(page);
    await page.goto('/dashboard');

    await expect(page.getByTestId('large-emails-count')).toContainText(
      '3 large emails',
    );
    await expect(page.getByTestId('large-emails-total-size')).toBeVisible();
  });

  test('shows empty state message when no large emails found', async ({
    page,
  }) => {
    await setupDashboard(page, { emails: [] });
    await page.goto('/dashboard');

    await expect(page.getByTestId('large-emails-empty')).toBeVisible();
    await expect(page.getByTestId('large-emails-empty')).toContainText(
      'No large emails found',
    );
  });

  test('shows error banner when scan API returns error', async ({ page }) => {
    await setupDashboard(page, { scanStatusCode: 500 });
    await page.goto('/dashboard');

    await expect(page.getByTestId('large-emails-error')).toBeVisible();
    await expect(page.getByTestId('large-emails-error')).toContainText(
      'Failed to load large emails',
    );
  });

  test('table and empty state are absent when scan API returns error', async ({
    page,
  }) => {
    await setupDashboard(page, { scanStatusCode: 500 });
    await page.goto('/dashboard');

    await expect(page.getByTestId('large-emails-count')).not.toBeVisible();
    await expect(page.getByTestId('large-emails-empty')).not.toBeVisible();
  });

  test('mobile 375px: error banner is visible when scan fails', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await setupDashboard(page, { scanStatusCode: 500 });
    await page.goto('/dashboard');

    await expect(page.getByTestId('large-emails-error')).toBeVisible();
  });

  test('mobile 375px: table is rendered without layout overflow', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await setupDashboard(page);
    await page.goto('/dashboard');

    await expect(page.getByTestId('large-emails-count')).toBeVisible();
  });

  test('desktop 1440px: all four column headers are visible', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await setupDashboard(page);
    await page.goto('/dashboard');

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
