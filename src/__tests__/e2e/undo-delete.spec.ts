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

async function deleteEmail(page: Page, checkboxId: string) {
  await page.goto('/dashboard');
  await page.getByTestId(checkboxId).check();
  await page.getByTestId('selection-delete').click();
  await expect(page.getByTestId('delete-preview-modal')).toBeVisible();
  await page.getByTestId('delete-preview-confirm').click();
  await expect(page.getByTestId('delete-preview-modal')).not.toBeVisible();
}

test.describe('Undo delete', () => {
  test('undo toast appears with correct count after successful deletion', async ({
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

    await deleteEmail(page, 'checkbox-e1');

    await expect(page.getByTestId('undo-toast')).toBeVisible();
    await expect(page.getByTestId('undo-toast')).toContainText('1 email');
    await expect(page.getByTestId('undo-button')).toBeVisible();
  });

  test('clicking Undo calls /api/emails/untrash and toast disappears', async ({
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

    let untrashCalled = false;
    let untrashBody: { ids?: string[] } = {};
    await page.route('**/api/emails/untrash', async (route) => {
      untrashCalled = true;
      const body = route.request().postDataJSON() as { ids?: string[] };
      untrashBody = body;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ untrashedCount: 1 }),
      });
    });

    await deleteEmail(page, 'checkbox-e1');
    await expect(page.getByTestId('undo-toast')).toBeVisible();
    await page.getByTestId('undo-button').click();

    await expect(page.getByTestId('undo-toast')).not.toBeVisible();
    expect(untrashCalled).toBe(true);
    expect(untrashBody.ids).toContain('e1');
  });

  test('toast auto-dismisses after 30 seconds', async ({ page }) => {
    await setupPage(page);
    await seedLargeEmailsCache(page, EMAILS);

    await page.route('**/api/emails/trash', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ trashedCount: 1 }),
      }),
    );

    await page.clock.install();

    await deleteEmail(page, 'checkbox-e1');
    await expect(page.getByTestId('undo-toast')).toBeVisible();

    await page.clock.runFor(30_000);

    await expect(page.getByTestId('undo-toast')).not.toBeVisible();
  });

  test('500 error from untrash shows error message in toast', async ({
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
    await page.route('**/api/emails/untrash', (route) =>
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Failed to untrash emails' }),
      }),
    );

    await deleteEmail(page, 'checkbox-e1');
    await expect(page.getByTestId('undo-toast')).toBeVisible();
    await page.getByTestId('undo-button').click();

    await expect(page.getByTestId('undo-error')).toBeVisible();
    await expect(page.getByTestId('undo-toast')).toBeVisible();
  });

  test('403 error from untrash shows re-auth message in toast', async ({
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
    await page.route('**/api/emails/untrash', (route) =>
      route.fulfill({
        status: 403,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'insufficient_scope' }),
      }),
    );

    await deleteEmail(page, 'checkbox-e1');
    await expect(page.getByTestId('undo-toast')).toBeVisible();
    await page.getByTestId('undo-button').click();

    await expect(page.getByTestId('undo-error')).toContainText(
      'sign out and sign back in',
    );
    await expect(page.getByTestId('undo-toast')).toBeVisible();
  });
});
