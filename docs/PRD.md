# Clean Gmail - Product Requirements Document

## Vision

A web application that connects to a Gmail account via the Gmail API, analyzes emails, and recommends which ones to delete to free up storage space. The app helps users reclaim their Google storage by identifying large, old, or bulk emails that are safe to remove.

## Problem

Gmail accounts accumulate years of emails — newsletters, promotions, large attachments, automated notifications — that consume Google Drive storage (shared 15GB free tier). Manually finding and deleting these is tedious and error-prone.

## Target User

Anyone who wants to clean up their Gmail storage efficiently through a simple, visual web interface.

---

## Iteration Plan

### Iteration 1 — Init Project

**Goal:** Empty project that compiles and serves a blank page.

- Initialize Next.js 16.1 project with pnpm 10.x and TypeScript 5.x (strict mode)
- Configure TypeScript with strict flags: `noUncheckedIndexedAccess`, `noImplicitReturns`, `noFallthroughCasesInSwitch`, `exactOptionalPropertyTypes`, `forceConsistentCasingInFileNames`
- Install and configure Tailwind CSS 4.x + DaisyUI 5.x
- Set up ESLint 9.x (flat config) + Prettier + typescript-eslint + eslint-plugin-import + eslint-plugin-boundaries
- Configure Husky + lint-staged for pre-commit hooks
- Install and configure Vitest 3.x + Playwright 1.49.x
- Create Clean Architecture folder structure under `src/`:
  - `domain/` (entities, value-objects, repositories, services, errors)
  - `application/` (use-cases, dtos, ports)
  - `infrastructure/` (persistence, gmail, auth, di)
  - `presentation/` (app, components, hooks)
  - `shared/` (types, utils)
- Set up eslint-plugin-boundaries rules to enforce the dependency rule (Domain ← Application ← Presentation, Domain ← Infrastructure)
- Dev server runs and serves a blank page

**Done when:** `pnpm dev` opens a blank page in the browser. `pnpm lint`, `pnpm format`, and `pnpm test` all pass. Pre-commit hook runs lint-staged successfully.

---

### Iteration 2 — Landing Page

**Goal:** Static landing page with app name and a "Sign in with Google" button (non-functional).

- Create main layout component
- Add app title, brief description, and a styled sign-in button
- Responsive design for mobile and desktop

**Done when:** Page renders with a sign-in button that does nothing yet.

---

### Iteration 3 — Google OAuth2 Flow

**Goal:** User can sign in with Google.

- Set up Google OAuth2 (redirect-based flow)
- "Sign in with Google" button triggers OAuth consent screen
- Receive auth code via redirect callback

**Done when:** User completes Google sign-in and is redirected back to the app.

---

### Iteration 4 — Persist Auth Session ✅

**Goal:** Save tokens and keep the user logged in.

- Exchange auth code for access/refresh tokens
- Store tokens (session storage or backend)
- Auto-refresh expired tokens
- Scopes: `gmail.readonly`

**Done when:** Page reload keeps the user authenticated.

---

### Iteration 5 — Account Status View

**Goal:** Show basic account info after login.

- Call `gmail.users.getProfile` with stored token
- Display: email address, total messages, total threads
- Show a logged-in state (avatar/email in header, sign-out button)

**Done when:** Dashboard shows account stats. Unauthenticated users see the landing page.

---

### Iteration 6 — Scan Large Emails (API)

**Goal:** Query Gmail for large emails and return metadata.

- Service function: `gmail.users.messages.list` with `larger:5M` query
- Fetch message metadata (sender, subject, date, size) in batches
- Handle API rate limits with retry logic

**Done when:** Function returns array of large email metadata.

---

### Iteration 7 — Display Large Emails Table

**Goal:** Show large emails in a UI table.

- Table component with columns: sender, subject (truncated), date, size
- Sort by size descending
- Show total count and total size as summary row

**Done when:** Page displays a table of large emails after scanning.

---

### Iteration 8 — Loading & Error States

**Goal:** Handle loading and errors gracefully in the UI.

- Loading spinner/skeleton while scanning
- Error banner if API call fails or user is not authenticated
- Empty state if no results found

**Done when:** All three states (loading, error, empty) render correctly.

---

### Iteration 9 — Scan Promotions

**Goal:** Find promotional emails.

- Add "Promotions" tab/filter using query `category:promotions`
- Reuse same table component from iteration 7
- Show count + total size

**Done when:** Promotions tab lists promotional emails.

---

### Iteration 10 — Scan Social

**Goal:** Find social notification emails.

- Add "Social" tab/filter using query `category:social`

**Done when:** Social tab lists social emails.

---

### Iteration 11 — Scan Old Emails

**Goal:** Find emails older than a threshold.

- Add age filter dropdown: 6 months, 1 year, 2 years, 5 years
- Use Gmail query `older_than:2y`

**Done when:** Selecting "Older than 1 year" shows matching emails.

---

### Iteration 12 — Scan Summary Dashboard

**Goal:** Visual overview of cleanup potential.

- Dashboard cards showing: large emails (count/size), promotions (count/size), social (count/size), old emails (count/size)
- Each card links to its detail table

**Done when:** Dashboard shows all category summaries at a glance.

---

### Iteration 13 — Cache Scan Results

**Goal:** Avoid repeated API calls by caching in the browser.

- Store scan metadata in localStorage/IndexedDB
- Reuse cache if <1 hour old
- "Rescan" button forces a fresh API call

**Done when:** Second page load shows results instantly. "Rescan" fetches fresh data.

---

### Iteration 14 — Top Senders Report

**Goal:** Rank senders by space used.

- "Top Senders" view aggregating cached data by sender
- Display: sender, email count, total size
- Top 20, sorted by size descending

**Done when:** Page shows a ranked list of top senders.

---

### Iteration 15 — Recommendations

**Goal:** Suggest cleanup actions ranked by impact.

- "Recommendations" view analyzing cached data
- Show actions like: "Delete 342 promotions — 128MB"
- Sorted by space saved descending

**Done when:** Page shows ranked cleanup recommendations.

---

### Iteration 16 — Select Emails for Deletion

**Goal:** Let users pick which emails to delete.

- Checkboxes on email rows (select individual or select all in category)
- "Select all from sender" option
- Running total of selected size shown

**Done when:** User can select emails and see the total size to be freed.

---

### Iteration 17 — Delete Preview

**Goal:** Confirm before trashing.

- "Delete Selected" button opens a confirmation modal
- Modal shows: count, total size, list of senders affected
- "Cancel" and "Confirm Delete" buttons

**Done when:** Modal appears with correct summary. Cancel closes it without changes.

---

### Iteration 18 — Delete Execute

**Goal:** Actually trash selected emails.

- On confirm, batch `gmail.users.messages.trash` calls
- Add `gmail.modify` scope (re-auth if needed)
- Show progress during deletion
- Save deleted IDs to localStorage for undo

**Done when:** Emails move to Trash. Success message shown.

---

### Iteration 19 — Undo Last Delete

**Goal:** Recover from accidental deletions.

- "Undo" toast/banner appears after deletion for 30 seconds
- Calls `gmail.users.messages.untrash` for each deleted ID

**Done when:** Clicking undo restores emails from Trash.

---

### Iteration 20 — Whitelist Senders

**Goal:** Protect senders from deletion suggestions.

- "Whitelist" button on sender rows / top senders
- Whitelisted senders stored in localStorage
- Excluded from recommendations and scan results

**Done when:** Whitelisted sender never appears in any results.

---

### Iteration 21 — Settings Page

**Goal:** User-configurable thresholds.

- Settings page with: size threshold, age threshold, whitelisted senders list
- Persist to localStorage
- Applied to all scans and recommendations

**Done when:** Changing size threshold updates scan results.

---

### Iteration 22 — Export Results

**Goal:** Download scan data for external analysis.

- "Export" button on any results view
- Export as JSON or CSV
- Includes all visible metadata

**Done when:** Clicking export downloads a valid JSON/CSV file.

---

## Non-Goals (Out of Scope)

- Multi-account management in a single session
- Permanent deletion (always Trash first)
- Modifying email content or labels (read + delete only)
- Real-time monitoring or scheduled cleanup

## API Quotas & Limits

- Gmail API free tier: 250 quota units/second per user
- Batch requests: up to 100 requests per batch
- Design must respect rate limits with backoff strategy

## Security Considerations

- OAuth2 tokens handled securely (never exposed in URLs or logs)
- No email content is stored — only metadata (sender, size, date, labels)
- Credentials never logged or transmitted beyond Google's OAuth flow
- Google Cloud project uses minimum required scopes:
  - `gmail.readonly` for scanning
  - `gmail.modify` for trash operations
