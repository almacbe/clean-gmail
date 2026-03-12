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

async function setupDashboard(page: Parameters<Parameters<typeof test>[1]>[0]) {
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
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(MOCK_SUMMARY),
    });
  });

  await setAuthCookie(page);
}

test.describe('Cache scan results', () => {
  test('Rescan button is visible on the dashboard', async ({ page }) => {
    await setupDashboard(page);
    await page.goto('/dashboard');

    await expect(page.getByTestId('rescan-button')).toBeVisible();
  });

  test('Rescan button is disabled while scans are loading', async ({
    page,
  }) => {
    // Delay scan responses to observe loading state
    await page.route('**/api/account-status', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_ACCOUNT_STATUS),
      });
    });

    await page.route('**/api/scan/large-emails', async (route) => {
      await new Promise((r) => setTimeout(r, 300));
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
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_SUMMARY),
      });
    });

    await setAuthCookie(page);
    await page.goto('/dashboard');

    // During loading the button should be disabled
    await expect(page.getByTestId('rescan-button')).toBeDisabled();

    // After loading completes, button is enabled
    await expect(page.getByTestId('rescan-button')).toBeEnabled();
  });

  test('second navigation uses cache — scan API routes are not called again', async ({
    page,
  }) => {
    test.setTimeout(60_000);

    await setupDashboard(page);

    // Track scan request counts
    const scanCallCounts: Record<string, number> = {
      'large-emails': 0,
      promotions: 0,
      social: 0,
      summary: 0,
    };

    page.on('request', (req) => {
      const url = req.url();
      if (url.includes('/api/scan/large-emails'))
        scanCallCounts['large-emails']++;
      else if (url.includes('/api/scan/promotions'))
        scanCallCounts['promotions']++;
      else if (url.includes('/api/scan/social')) scanCallCounts['social']++;
      else if (url.includes('/api/scan/summary')) scanCallCounts['summary']++;
    });

    // First navigation — data fetched and cached
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('summary-card-large-emails')).toBeVisible();

    // Navigate to another page and back (within same context = same localStorage)
    await page.goto('/');
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('summary-card-large-emails')).toBeVisible();

    // Scan routes should only have been called once (during first visit)
    expect(scanCallCounts['large-emails']).toBe(1);
    expect(scanCallCounts['promotions']).toBe(1);
    expect(scanCallCounts['social']).toBe(1);
    expect(scanCallCounts['summary']).toBe(1);
  });

  test('Rescan clears cache and triggers fresh API calls', async ({ page }) => {
    await setupDashboard(page);

    const scanCallCounts: Record<string, number> = {
      'large-emails': 0,
      promotions: 0,
      social: 0,
      summary: 0,
    };

    page.on('request', (req) => {
      const url = req.url();
      if (url.includes('/api/scan/large-emails'))
        scanCallCounts['large-emails']++;
      else if (url.includes('/api/scan/promotions'))
        scanCallCounts['promotions']++;
      else if (url.includes('/api/scan/social')) scanCallCounts['social']++;
      else if (url.includes('/api/scan/summary')) scanCallCounts['summary']++;
    });

    // Initial load
    await page.goto('/dashboard');
    await expect(page.getByTestId('summary-card-large-emails')).toBeVisible();
    await expect(page.getByTestId('rescan-button')).toBeEnabled();

    // Click Rescan
    await page.getByTestId('rescan-button').click();

    // Wait for scans to complete again
    await expect(page.getByTestId('rescan-button')).toBeEnabled();
    await expect(page.getByTestId('summary-card-large-emails')).toBeVisible();

    // Each scan route should have been called exactly twice
    expect(scanCallCounts['large-emails']).toBe(2);
    expect(scanCallCounts['promotions']).toBe(2);
    expect(scanCallCounts['social']).toBe(2);
    expect(scanCallCounts['summary']).toBe(2);
  });

  test('mobile 375px: Rescan button is visible and clickable', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await setupDashboard(page);
    await page.goto('/dashboard');

    const rescanBtn = page.getByTestId('rescan-button');
    await expect(rescanBtn).toBeVisible();

    await expect(page.getByTestId('summary-card-large-emails')).toBeVisible();
    await rescanBtn.click();
    await expect(page.getByTestId('summary-card-large-emails')).toBeVisible();
  });

  test('desktop 1440px: Rescan button is visible', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await setupDashboard(page);
    await page.goto('/dashboard');

    await expect(page.getByTestId('rescan-button')).toBeVisible();
  });
});
