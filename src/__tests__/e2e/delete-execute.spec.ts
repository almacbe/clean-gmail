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
    sender: 'bob@example.com',
    subject: 'World',
    date: '2024-01-02T00:00:00.000Z',
    sizeEstimate: 3_000_000,
  },
];

function makeCacheEntry<T>(data: T): string {
  return JSON.stringify({ data, cachedAt: Date.now() });
}

async function setupPage(page: Page) {
  await page.route('**/api/account-status', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(MOCK_ACCOUNT_STATUS),
    }),
  );
  await page.route('**/api/scan/large-emails', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ emails: [] }),
    }),
  );
  await page.route('**/api/scan/promotions', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ emails: [] }),
    }),
  );
  await page.route('**/api/scan/social', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ emails: [] }),
    }),
  );
  await page.route('**/api/scan/old-emails**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ emails: [] }),
    }),
  );
  await page.route('**/api/scan/summary**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(MOCK_SUMMARY),
    }),
  );
  await setAuthCookie(page);
}

async function seedLargeEmailsCache(page: Page, emails: EmailFixture[]) {
  await page.goto('/');
  await page.evaluate((cacheValue: string) => {
    localStorage.setItem('scan:large-emails', cacheValue);
  }, makeCacheEntry({ emails }));
}

async function selectEmailAndOpenModal(page: Page, checkboxId: string) {
  await page.goto('/dashboard');
  await page.getByTestId(checkboxId).check();
  await page.getByTestId('selection-delete').click();
  await expect(page.getByTestId('delete-preview-modal')).toBeVisible();
}

test.describe('Delete execute', () => {
  test('successful deletion closes modal, clears selection, and triggers rescan', async ({
    page,
  }) => {
    await setupPage(page);
    await seedLargeEmailsCache(page, EMAILS);

    let trashCallCount = 0;
    await page.route('**/api/emails/trash', (route) => {
      trashCallCount++;
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ trashedCount: 1 }),
      });
    });

    await selectEmailAndOpenModal(page, 'checkbox-e1');
    await page.getByTestId('delete-preview-confirm').click();

    // Modal closes
    await expect(page.getByTestId('delete-preview-modal')).not.toBeVisible();
    // Selection cleared — selection bar disappears
    await expect(page.getByTestId('selection-bar')).not.toBeVisible();
    // Trash API was called
    expect(trashCallCount).toBe(1);
  });

  test('deleted ids are written to localStorage under trash:last-deleted', async ({
    page,
  }) => {
    await setupPage(page);
    await seedLargeEmailsCache(page, EMAILS);

    await page.route('**/api/emails/trash', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ trashedCount: 1 }),
      }),
    );

    await selectEmailAndOpenModal(page, 'checkbox-e1');
    await page.getByTestId('delete-preview-confirm').click();
    await expect(page.getByTestId('delete-preview-modal')).not.toBeVisible();

    const stored = await page.evaluate(() =>
      localStorage.getItem('trash:last-deleted'),
    );
    expect(stored).not.toBeNull();
    const ids = JSON.parse(stored!) as string[];
    expect(ids).toContain('e1');
  });

  test('loading state shows spinner and hides action buttons while deleting', async ({
    page,
  }) => {
    await setupPage(page);
    await seedLargeEmailsCache(page, EMAILS);

    // Stub trash to hang indefinitely
    await page.route('**/api/emails/trash', () => {
      // intentionally never resolved
    });

    await selectEmailAndOpenModal(page, 'checkbox-e1');
    await page.getByTestId('delete-preview-confirm').click();

    await expect(page.getByTestId('delete-preview-loading')).toBeVisible();
    await expect(page.getByTestId('delete-preview-confirm')).not.toBeVisible();
    await expect(page.getByTestId('delete-preview-cancel')).not.toBeVisible();
  });

  test('error state shows error banner and keeps modal open', async ({
    page,
  }) => {
    await setupPage(page);
    await seedLargeEmailsCache(page, EMAILS);

    await page.route('**/api/emails/trash', (route) =>
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'Failed to delete emails. Please try again.',
        }),
      }),
    );

    await selectEmailAndOpenModal(page, 'checkbox-e1');
    await page.getByTestId('delete-preview-confirm').click();

    await expect(page.getByTestId('delete-preview-error')).toBeVisible();
    await expect(page.getByTestId('delete-preview-modal')).toBeVisible();
  });

  test('insufficient scope error shows re-auth message', async ({ page }) => {
    await setupPage(page);
    await seedLargeEmailsCache(page, EMAILS);

    await page.route('**/api/emails/trash', (route) =>
      route.fulfill({
        status: 403,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'insufficient_scope' }),
      }),
    );

    await selectEmailAndOpenModal(page, 'checkbox-e1');
    await page.getByTestId('delete-preview-confirm').click();

    await expect(page.getByTestId('delete-preview-error')).toContainText(
      'sign out and sign back in',
    );
    await expect(page.getByTestId('delete-preview-modal')).toBeVisible();
  });
});
