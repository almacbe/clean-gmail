import { test, expect } from '@playwright/test';
import { setAuthCookie } from './helpers/auth';

const MOCK_ACCOUNT_STATUS = {
  emailAddress: 'testuser@gmail.com',
  messagesTotal: 12345,
  threadsTotal: 5678,
};

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

const EMAILS: EmailFixture[] = [
  {
    id: 'e1',
    sender: 'alice@example.com',
    subject: 'Hello',
    date: '2024-01-01T00:00:00.000Z',
    sizeEstimate: 5_000_000,
  },
  {
    id: 'e2',
    sender: 'alice@example.com',
    subject: 'World',
    date: '2024-01-02T00:00:00.000Z',
    sizeEstimate: 3_000_000,
  },
  {
    id: 'e3',
    sender: 'bob@example.com',
    subject: 'Another',
    date: '2024-01-03T00:00:00.000Z',
    sizeEstimate: 2_000_000,
  },
];

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
      body: JSON.stringify({ emails: [] }),
    });
  });

  await page.route('**/api/scan/promotions', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ emails: [] }),
    });
  });

  await page.route('**/api/scan/social', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ emails: [] }),
    });
  });

  await page.route('**/api/scan/old-emails**', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ emails: [] }),
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
  await page.goto('/');
  await page.evaluate((cacheValue: string) => {
    localStorage.setItem('scan:large-emails', cacheValue);
  }, makeCacheEntry({ emails }));
}

test.describe('Email selection', () => {
  test('selecting a single checkbox shows selection bar with count and size', async ({
    page,
  }) => {
    await setupPage(page);
    await seedLargeEmailsCache(page, EMAILS);
    await page.goto('/dashboard');

    await expect(page.getByTestId('checkbox-e1')).toBeVisible();
    await page.getByTestId('checkbox-e1').check();

    await expect(page.getByTestId('selection-bar')).toBeVisible();
    await expect(page.getByTestId('selection-count')).toContainText(
      '1 email selected',
    );
    await expect(page.getByTestId('selection-size')).toContainText('4.8 MB');
  });

  test('selection bar is not visible when no emails are selected', async ({
    page,
  }) => {
    await setupPage(page);
    await seedLargeEmailsCache(page, EMAILS);
    await page.goto('/dashboard');

    await expect(page.getByTestId('selection-bar')).not.toBeVisible();
  });

  test('select-all checkbox selects all rows and updates selection bar', async ({
    page,
  }) => {
    await setupPage(page);
    await seedLargeEmailsCache(page, EMAILS);
    await page.goto('/dashboard');

    await expect(page.getByTestId('select-all-checkbox')).toBeVisible();
    await page.getByTestId('select-all-checkbox').check();

    await expect(page.getByTestId('selection-bar')).toBeVisible();
    await expect(page.getByTestId('selection-count')).toContainText(
      '3 emails selected',
    );
  });

  test('deselecting one after select-all decrements count', async ({
    page,
  }) => {
    await setupPage(page);
    await seedLargeEmailsCache(page, EMAILS);
    await page.goto('/dashboard');

    await page.getByTestId('select-all-checkbox').check();
    await expect(page.getByTestId('selection-count')).toContainText(
      '3 emails selected',
    );

    await page.getByTestId('checkbox-e1').uncheck();
    await expect(page.getByTestId('selection-count')).toContainText(
      '2 emails selected',
    );
  });

  test('clear selection button hides the selection bar', async ({ page }) => {
    await setupPage(page);
    await seedLargeEmailsCache(page, EMAILS);
    await page.goto('/dashboard');

    await page.getByTestId('checkbox-e1').check();
    await expect(page.getByTestId('selection-bar')).toBeVisible();

    await page.getByTestId('selection-clear').click();
    await expect(page.getByTestId('selection-bar')).not.toBeVisible();
  });

  test('switching tabs preserves selection', async ({ page }) => {
    await setupPage(page);
    await seedLargeEmailsCache(page, EMAILS);

    // Also seed promotions cache
    await page.evaluate(
      (cacheValue: string) => {
        localStorage.setItem('scan:promotions', cacheValue);
      },
      makeCacheEntry({ emails: [] }),
    );

    await page.goto('/dashboard');

    await page.getByTestId('checkbox-e1').check();
    await expect(page.getByTestId('selection-count')).toContainText(
      '1 email selected',
    );

    // Switch to promotions tab
    await page.getByTestId('tab-promotions').click();
    await expect(page.getByTestId('panel-promotions')).toBeVisible();

    // Bar should still show the previous selection
    await expect(page.getByTestId('selection-bar')).toBeVisible();
    await expect(page.getByTestId('selection-count')).toContainText(
      '1 email selected',
    );

    // Switch back to large emails tab
    await page.getByTestId('tab-large-emails').click();
    await expect(page.getByTestId('checkbox-e1')).toBeChecked();
  });

  test('select-all from same-sender button selects all sender emails', async ({
    page,
  }) => {
    await setupPage(page);
    await seedLargeEmailsCache(page, EMAILS);
    await page.goto('/dashboard');

    // Click the "all" button next to alice's first email
    const firstRow = page
      .locator('[data-testid="panel-large-emails"] tbody tr')
      .first();
    await firstRow.getByTitle('Select all from alice@example.com').click();

    await expect(page.getByTestId('selection-count')).toContainText(
      '2 emails selected',
    );
    await expect(page.getByTestId('checkbox-e1')).toBeChecked();
    await expect(page.getByTestId('checkbox-e2')).toBeChecked();
    await expect(page.getByTestId('checkbox-e3')).not.toBeChecked();
  });
});
