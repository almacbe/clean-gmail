import { test, expect } from '@playwright/test';
import { setAuthCookie } from './helpers/auth';

const MOCK_ACCOUNT_STATUS = {
  emailAddress: 'testuser@gmail.com',
  messagesTotal: 12345,
  threadsTotal: 5678,
};

const MOCK_SCAN_RESPONSE = { emails: [] };

const MOCK_SUMMARY = {
  largeEmails: { count: 0, totalSizeBytes: 0 },
  promotions: { count: 0, totalSizeBytes: 0 },
  social: { count: 0, totalSizeBytes: 0 },
  oldEmails: { count: 0, totalSizeBytes: 0 },
};

type EmailFixture = {
  id: string;
  sender: string;
  subject: string;
  date: string;
  sizeEstimate: number;
};

function makeCacheEntry<T>(data: T): string {
  return JSON.stringify({ data, cachedAt: Date.now() });
}

async function setupPage(page: Parameters<Parameters<typeof test>[1]>[0]) {
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

function makeEmail(
  id: string,
  sizeEstimate: number,
  sender = 'sender@example.com',
): EmailFixture {
  return {
    id,
    sender,
    subject: `Subject ${id}`,
    date: '2024-01-01T00:00:00.000Z',
    sizeEstimate,
  };
}

test.describe('Recommendations page', () => {
  test('table renders with data-testid="recommendations-list" when cache has data', async ({
    page,
  }) => {
    await setupPage(page);

    await page.goto('/dashboard');
    await page.evaluate(
      (cacheValue: string) => {
        localStorage.setItem('scan:large-emails', cacheValue);
      },
      makeCacheEntry({ emails: [makeEmail('e1', 5_000_000)] }),
    );

    await page.goto('/dashboard/recommendations');

    await expect(page.getByTestId('recommendations-list')).toBeVisible();
  });

  test('items sorted by size descending (first row has largest category)', async ({
    page,
  }) => {
    await setupPage(page);

    await page.goto('/dashboard');
    await page.evaluate(
      ([largeCache, promoCache]: string[]) => {
        localStorage.setItem('scan:large-emails', largeCache!);
        localStorage.setItem('scan:promotions', promoCache!);
      },
      [
        makeCacheEntry({ emails: [makeEmail('l1', 3_000_000)] }),
        makeCacheEntry({
          emails: [makeEmail('p1', 10_000_000), makeEmail('p2', 2_000_000)],
        }),
      ],
    );

    await page.goto('/dashboard/recommendations');

    await expect(page.getByTestId('recommendations-list')).toBeVisible();
    const firstRow = page
      .locator('[data-testid="recommendations-list"] tbody tr')
      .first();
    await expect(firstRow).toContainText('promotions');
  });

  test('empty categories are excluded — only seeded category appears', async ({
    page,
  }) => {
    await setupPage(page);

    await page.goto('/dashboard');
    await page.evaluate(
      (cacheValue: string) => {
        localStorage.setItem('scan:large-emails', cacheValue);
      },
      makeCacheEntry({ emails: [makeEmail('e1', 5_000_000)] }),
    );

    await page.goto('/dashboard/recommendations');

    await expect(page.getByTestId('recommendations-list')).toBeVisible();
    const rows = page.locator('[data-testid="recommendations-list"] tbody tr');
    await expect(rows).toHaveCount(1);
  });

  test('error state shown when no cache data', async ({ page }) => {
    await setupPage(page);

    await page.goto('/dashboard/recommendations');

    await expect(page.getByTestId('recommendations-error')).toBeVisible();
    await expect(page.getByTestId('recommendations-error')).toContainText(
      'No scan data available',
    );
  });

  test('navigation link from dashboard goes to /dashboard/recommendations', async ({
    page,
  }) => {
    await setupPage(page);
    await page.goto('/dashboard');

    const link = page.getByTestId('recommendations-link');
    await expect(link).toBeVisible();
    await link.click();

    await expect(page).toHaveURL('/dashboard/recommendations');
  });

  test('unauthenticated user is redirected to /', async ({ page }) => {
    await page.goto('/dashboard/recommendations');

    await expect(page).toHaveURL('/');
  });
});
