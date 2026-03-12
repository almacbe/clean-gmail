# Iteration 6 — Scan Large Emails (API): Implementation Plan

---

## 1. Scope Analysis

**What this iteration delivers:**

- Call `gmail.users.messages.list` with `q=larger:5M`, paginate all results
- Fetch full message metadata (sender, subject, date, size) in batches of ≤100
- Exponential backoff retry for 429/500 errors
- Return typed array of email metadata via `GET /api/scan/large-emails`

**Layers affected:**

| Layer          | Affected      | Reason                                                     |
| -------------- | ------------- | ---------------------------------------------------------- |
| Domain         | Yes           | New `EmailMetadata` value object, `LargeEmailScanner` port |
| Application    | Yes           | New `ScanLargeEmails` use case + DTOs                      |
| Infrastructure | Yes           | New `GmailLargeEmailAdapter`, DI container update          |
| Presentation   | Yes (minimal) | New API route `/api/scan/large-emails`                     |

**What already exists:**

- `GmailProfileAdapter` — OAuth2 client pattern to follow
- `container.ts` — factory function pattern
- `/api/account-status/route.ts` — route handler pattern
- `gmail.readonly` scope already configured

**OUT OF SCOPE:**

- UI table component (Iteration 7)
- Loading/error/empty state UI (Iteration 8)
- Promotions/Social/Old Emails scans (Iterations 9–11)
- Caching (Iteration 13)
- No Prisma/DB changes

---

## 2. Domain Layer Changes

### `EmailMetadata` value object

File: `src/domain/value-objects/EmailMetadata.ts`

Fields: `id: string`, `sender: string`, `subject: string`, `date: Date`, `sizeEstimate: number`

- Private constructor, static `create()` factory
- Validates: `id` non-empty, `sizeEstimate` non-negative integer, `date` is a valid Date
- `sender` and `subject` may be empty strings
- Zero external imports

### `InvalidEmailMetadataError`

File: `src/domain/errors/InvalidEmailMetadataError.ts`

### `LargeEmailScanner` port interface

File: `src/domain/repositories/LargeEmailScanner.ts`

```typescript
interface LargeEmailScanner {
  scanLargeEmails(accessToken: string): Promise<EmailMetadata[]>;
}
```

---

## 3. Application Layer Changes

### `ScanLargeEmails` use case

File: `src/application/use-cases/ScanLargeEmails.ts`

```typescript
class ScanLargeEmails {
  constructor(private readonly scanner: LargeEmailScanner) {}
  async execute(accessToken: string): Promise<ScanLargeEmailsOutput>;
}
```

Maps `EmailMetadata[]` to DTO, serializing `date` to ISO 8601 string.

### DTOs

File: `src/application/dtos/ScanLargeEmailsOutput.ts`

```typescript
type EmailMetadataDto = {
  readonly id: string;
  readonly sender: string;
  readonly subject: string;
  readonly date: string; // ISO 8601 — JSON-serializable
  readonly sizeEstimate: number;
};

type ScanLargeEmailsOutput = {
  readonly emails: EmailMetadataDto[];
};
```

---

## 4. Infrastructure Layer Changes

### `GmailLargeEmailAdapter`

File: `src/infrastructure/gmail/GmailLargeEmailAdapter.ts`

Implements `LargeEmailScanner`:

1. Build OAuth2 client, set credentials
2. Paginate `messages.list` with `q: 'larger:5M'` to collect all IDs
3. Chunk IDs into groups of ≤100, fetch metadata in parallel per chunk using `messages.get` with `format: 'metadata'`, `metadataHeaders: ['From', 'Subject', 'Date']`
4. Private `withRetry<T>` helper: catches 429/500, retries up to 3 times with `2^attempt * 100ms` backoff
5. Parse headers, construct `EmailMetadata` instances

### DI Container update

File: `src/infrastructure/di/container.ts` (modified)

Add: `makeScanLargeEmailsUseCase(): ScanLargeEmails`

### API Route

File: `src/app/api/scan/large-emails/route.ts`

Same pattern as `/api/account-status/route.ts` — `getToken` guard → factory → `execute` → `NextResponse.json`

---

## 5. Presentation Layer Changes

API-only iteration. No UI, no components, no React Query hooks. The route handler is the only presentation-layer addition.

---

## 6. Testing Plan

### Application Layer (PRIMARY)

File: `src/__tests__/application/ScanLargeEmails.test.ts`

| Scenario                       | Expected                                            |
| ------------------------------ | --------------------------------------------------- |
| Happy path — 3 emails returned | Output `emails` array with all fields mapped        |
| Empty result                   | `output.emails` is `[]`                             |
| Single email                   | Array length 1, correct fields                      |
| Passes access token to scanner | `scanner.scanLargeEmails` called with correct token |
| Scanner rejects                | Error propagates from `execute()`                   |
| Date serialization             | `date` field is `.toISOString()` string             |
| Empty subject                  | DTO maps subject as `''`                            |

### Domain Layer

File: `src/__tests__/domain/value-objects/EmailMetadata.test.ts`

| Scenario                         | Expected                                  |
| -------------------------------- | ----------------------------------------- |
| Valid input                      | Returns EmailMetadata with correct fields |
| Empty `id`                       | Throws `InvalidEmailMetadataError`        |
| Negative `sizeEstimate`          | Throws `InvalidEmailMetadataError`        |
| Non-integer `sizeEstimate` (1.5) | Throws `InvalidEmailMetadataError`        |
| Invalid Date                     | Throws `InvalidEmailMetadataError`        |
| Empty `subject` allowed          | Returns valid instance                    |
| Zero `sizeEstimate` allowed      | Returns valid instance                    |

### Infrastructure Layer

File: `src/__tests__/infrastructure/gmail/GmailLargeEmailAdapter.test.ts`

Mock `googleapis` with `vi.hoisted`/`vi.mock`.

| Scenario                                                           | Expected                                     |
| ------------------------------------------------------------------ | -------------------------------------------- |
| Calls `messages.list` with `q: 'larger:5M'`                        | Spy verified                                 |
| Paginates on `nextPageToken`                                       | `messages.list` called twice                 |
| Calls `messages.get` with `format: 'metadata'` and correct headers | Spy verified                                 |
| Batches 150 IDs in chunks of 100                                   | `messages.get` called 150 times              |
| Retries on 429, succeeds second attempt                            | `messages.get` called twice, result returned |
| Exhausts retries — throws                                          | Rejects after 3 attempts                     |
| Sets OAuth2 credentials                                            | `setCredentials` called with access token    |
| Returns `EmailMetadata` instances                                  | Result items are `EmailMetadata`             |
| Missing `Subject` header → empty string                            | `subject` is `''`                            |
| `messages.list` returns no messages                                | Returns `[]`                                 |

### Presentation E2E

NOT APPLICABLE — no UI added in this iteration.

---

## 7. Definition of Done Checklist

| Item                                 | Applicable | How satisfied                                       |
| ------------------------------------ | ---------- | --------------------------------------------------- |
| Zero `any` types                     | ✅         | Googleapis types used; null coalescing throughout   |
| ESLint passes                        | ✅         | `pnpm lint` before merge                            |
| Prettier formatting                  | ✅         | `pnpm format` before commit                         |
| No circular deps                     | ✅         | Strict inward dependency chain                      |
| Domain zero external imports         | ✅         | EmailMetadata, error, port — no external deps       |
| Application → Domain only            | ✅         | ScanLargeEmails imports only domain types           |
| Infrastructure implements interfaces | ✅         | GmailLargeEmailAdapter implements LargeEmailScanner |
| Presentation → Application only      | ✅         | Route handler uses DI factory, not adapter directly |
| Single responsibility per use case   | ✅         | ScanLargeEmails does one thing                      |
| No fat interfaces                    | ✅         | LargeEmailScanner has one method                    |
| Application tests                    | ✅         | ScanLargeEmails.test.ts                             |
| Domain tests                         | ✅         | EmailMetadata.test.ts                               |
| Infrastructure tests                 | ✅         | GmailLargeEmailAdapter.test.ts                      |
| E2E tests                            | N/A        | No UI added                                         |
| Gmail rate limits respected          | ✅         | Exponential backoff retry in adapter                |
| Batch requests                       | ✅         | Chunks of ≤100 IDs                                  |
| OAuth tokens not exposed             | ✅         | Token only used server-side, never returned         |
| Only metadata stored                 | ✅         | No email body content                               |
| Feature branch                       | ✅         | `feat/iteration-6-scan-large-emails`                |
| docs/PRD.md updated                  | ✅         | Mark Iteration 6 complete after merge               |

---

## 8. File List

### New files

```
src/domain/errors/InvalidEmailMetadataError.ts
src/domain/value-objects/EmailMetadata.ts
src/domain/repositories/LargeEmailScanner.ts
src/application/use-cases/ScanLargeEmails.ts
src/application/dtos/ScanLargeEmailsOutput.ts
src/infrastructure/gmail/GmailLargeEmailAdapter.ts
src/app/api/scan/large-emails/route.ts
src/__tests__/application/ScanLargeEmails.test.ts
src/__tests__/domain/value-objects/EmailMetadata.test.ts
src/__tests__/infrastructure/gmail/GmailLargeEmailAdapter.test.ts
```

### Modified files

```
src/infrastructure/di/container.ts    → Add makeScanLargeEmailsUseCase
docs/PRD.md                           → Mark Iteration 6 complete
```

### Unchanged

```
src/domain/entities/                  (untouched)
src/infrastructure/auth/              (untouched)
src/presentation/components/          (no UI)
src/__tests__/e2e/                    (no E2E)
prisma/                               (not needed)
```

---

## 9. Implementation Order

```
Step 1  — git checkout -b feat/iteration-6-scan-large-emails

Step 2  — Domain: InvalidEmailMetadataError
          Create: src/domain/errors/InvalidEmailMetadataError.ts

Step 3  — Domain: EmailMetadata value object
          Create: src/domain/value-objects/EmailMetadata.ts

Step 4  — Domain: LargeEmailScanner port interface
          Create: src/domain/repositories/LargeEmailScanner.ts

Step 5  — Domain tests
          Create: src/__tests__/domain/value-objects/EmailMetadata.test.ts
          Verify: pnpm test -- EmailMetadata  ← must pass

Step 6  — Application: ScanLargeEmailsOutput DTO
          Create: src/application/dtos/ScanLargeEmailsOutput.ts

Step 7  — Application: ScanLargeEmails use case
          Create: src/application/use-cases/ScanLargeEmails.ts

Step 8  — Application tests
          Create: src/__tests__/application/ScanLargeEmails.test.ts
          Verify: pnpm test -- ScanLargeEmails  ← must pass

Step 9  — Infrastructure: GmailLargeEmailAdapter
          Create: src/infrastructure/gmail/GmailLargeEmailAdapter.ts

Step 10 — Infrastructure tests
          Create: src/__tests__/infrastructure/gmail/GmailLargeEmailAdapter.test.ts
          Verify: pnpm test -- GmailLargeEmailAdapter  ← must pass

Step 11 — Infrastructure: DI container update
          Modify: src/infrastructure/di/container.ts

Step 12 — Presentation: API route
          Create: src/app/api/scan/large-emails/route.ts

Step 13 — Full test + lint pass
          pnpm test
          pnpm lint
          pnpm format

Step 14 — Manual smoke test
          pnpm dev → GET /api/scan/large-emails (authenticated)
          Verify JSON response with emails array containing metadata objects
          Verify no access token in response

Step 15 — Browser smoke test with Chrome extension
          Verify every "Done when" criterion in the running app
          Record GIF

Step 16 — Update docs/PRD.md (mark Iteration 6 complete)

Step 17 — Commit and open PR against main
```
