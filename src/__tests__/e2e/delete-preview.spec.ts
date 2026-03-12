import { test, expect, type Page } from '@playwright/test';
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

function makeCacheEntry<T>(data: T): string {
  return JSON.stringify({ data, cachedAt: Date.now() });
}

async function setupPage(page: Page) {
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

async function seedLargeEmailsCache(page: Page, emails: EmailFixture[]) {
  await page.goto('/');
  await page.evaluate((cacheValue: string) => {
    localStorage.setItem('scan:large-emails', cacheValue);
  }, makeCacheEntry({ emails }));
}

test.describe('Delete preview modal', () => {
  test('opens with selected count, size, and affected senders', async ({
    page,
  }) => {
    await setupPage(page);
    await seedLargeEmailsCache(page, EMAILS);
    await page.goto('/dashboard');

    await page.getByTestId('checkbox-e1').check();
    await page.getByTestId('checkbox-e3').check();
    await page.getByTestId('selection-delete').click();

    await expect(page.getByTestId('delete-preview-modal')).toBeVisible();
    await expect(page.getByTestId('delete-preview-count')).toContainText(
      '2 emails selected',
    );
    await expect(page.getByTestId('delete-preview-size')).toContainText(
      '6.7 MB',
    );
    const modal = page.getByTestId('delete-preview-modal');
    await expect(modal.getByText('alice@example.com')).toBeVisible();
    await expect(modal.getByText('bob@example.com')).toBeVisible();
  });

  test('cancel closes modal without changing selection', async ({ page }) => {
    await setupPage(page);
    await seedLargeEmailsCache(page, EMAILS);
    await page.goto('/dashboard');

    await page.getByTestId('checkbox-e2').check();
    await page.getByTestId('selection-delete').click();
    await expect(page.getByTestId('delete-preview-modal')).toBeVisible();

    await page.getByTestId('delete-preview-cancel').click();

    await expect(page.getByTestId('delete-preview-modal')).not.toBeVisible();
    await expect(page.getByTestId('selection-bar')).toBeVisible();
    await expect(page.getByTestId('selection-count')).toContainText(
      '1 email selected',
    );
    await expect(page.getByTestId('checkbox-e2')).toBeChecked();
  });

  test('confirm closes modal and keeps selection unchanged in this iteration', async ({
    page,
  }) => {
    await setupPage(page);
    await seedLargeEmailsCache(page, EMAILS);
    await page.goto('/dashboard');

    await page.getByTestId('checkbox-e1').check();
    await page.getByTestId('selection-delete').click();
    await expect(page.getByTestId('delete-preview-modal')).toBeVisible();

    await page.getByTestId('delete-preview-confirm').click();

    await expect(page.getByTestId('delete-preview-modal')).not.toBeVisible();
    await expect(page.getByTestId('selection-count')).toContainText(
      '1 email selected',
    );
    await expect(page.getByTestId('checkbox-e1')).toBeChecked();
  });
});
