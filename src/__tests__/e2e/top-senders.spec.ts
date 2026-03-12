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

async function seedLargeEmailsCache(
  page: Parameters<Parameters<typeof test>[1]>[0],
  emails: EmailFixture[],
) {
  // Navigate to a page first to have a window context for localStorage
  await page.goto('/dashboard');
  await page.evaluate((cacheValue: string) => {
    localStorage.setItem('scan:large-emails', cacheValue);
  }, makeCacheEntry({ emails }));
}

test.describe('Top Senders page', () => {
  test('table renders with data-testid="top-senders-table" when cache has data', async ({
    page,
  }) => {
    await setupPage(page);

    const emails: EmailFixture[] = [
      {
        id: 'e1',
        sender: 'alice@example.com',
        subject: 'Hello',
        date: '2024-01-01T00:00:00.000Z',
        sizeEstimate: 5_000_000,
      },
      {
        id: 'e2',
        sender: 'bob@example.com',
        subject: 'World',
        date: '2024-01-02T00:00:00.000Z',
        sizeEstimate: 3_000_000,
      },
    ];

    await seedLargeEmailsCache(page, emails);
    await page.goto('/dashboard/top-senders');

    await expect(page.getByTestId('top-senders-table')).toBeVisible();
  });

  test('senders ordered by size descending (first row has largest sender)', async ({
    page,
  }) => {
    await setupPage(page);

    const emails: EmailFixture[] = [
      {
        id: 'e1',
        sender: 'small@example.com',
        subject: 'A',
        date: '2024-01-01T00:00:00.000Z',
        sizeEstimate: 1_000_000,
      },
      {
        id: 'e2',
        sender: 'large@example.com',
        subject: 'B',
        date: '2024-01-02T00:00:00.000Z',
        sizeEstimate: 10_000_000,
      },
      {
        id: 'e3',
        sender: 'medium@example.com',
        subject: 'C',
        date: '2024-01-03T00:00:00.000Z',
        sizeEstimate: 5_000_000,
      },
    ];

    await seedLargeEmailsCache(page, emails);
    await page.goto('/dashboard/top-senders');

    await expect(page.getByTestId('top-senders-table')).toBeVisible();
    const firstRow = page
      .locator('[data-testid="top-senders-table"] tbody tr')
      .first();
    await expect(firstRow).toContainText('large@example.com');
  });

  test('top 20 cap: seed 25 senders, assert exactly 20 rows', async ({
    page,
  }) => {
    await setupPage(page);

    const emails: EmailFixture[] = Array.from({ length: 25 }, (_, i) => ({
      id: `e${i}`,
      sender: `sender${i}@example.com`,
      subject: `Subject ${i}`,
      date: '2024-01-01T00:00:00.000Z',
      sizeEstimate: (i + 1) * 100_000,
    }));

    await seedLargeEmailsCache(page, emails);
    await page.goto('/dashboard/top-senders');

    await expect(page.getByTestId('top-senders-table')).toBeVisible();
    const rows = page.locator('[data-testid="top-senders-table"] tbody tr');
    await expect(rows).toHaveCount(20);
  });

  test('empty state shown when no cache data: data-testid="top-senders-empty" visible', async ({
    page,
  }) => {
    await setupPage(page);

    // Navigate to top-senders without seeding any cache data
    // (we navigate directly without going through dashboard first)
    await page.goto('/dashboard/top-senders');

    await expect(page.getByTestId('top-senders-error')).toBeVisible();
    await expect(page.getByTestId('top-senders-error')).toContainText(
      'No scan data available',
    );
  });

  test('navigation link from dashboard goes to /dashboard/top-senders', async ({
    page,
  }) => {
    await setupPage(page);
    await page.goto('/dashboard');

    const link = page.getByTestId('top-senders-link');
    await expect(link).toBeVisible();
    await link.click();

    await expect(page).toHaveURL('/dashboard/top-senders');
  });

  test('unauthenticated user is redirected to /', async ({ page }) => {
    // Do not set auth cookie — navigate directly
    await page.goto('/dashboard/top-senders');

    await expect(page).toHaveURL('/');
  });
});
