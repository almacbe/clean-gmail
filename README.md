# Clean Gmail

Clean Gmail is a web app that connects to your Gmail account, analyzes email metadata, and helps you identify high-impact cleanup opportunities.

## Why this project

Gmail inboxes accumulate years of promotions, social notifications, and large messages that silently consume storage. Clean Gmail makes cleanup fast by surfacing what to delete first.

## Current status

Implemented today:

- Google OAuth sign-in with persistent JWT session and token refresh
- Dashboard with account overview (email, total messages, total threads)
- Scans for:
  - Large emails (`larger:5M`)
  - Promotions (`category:promotions`)
  - Social (`category:social`)
  - Old emails (`older_than: 6m / 1y / 2y / 5y`)
- Summary cards for each category (count + total size)
- Local caching of scan results (1 hour TTL) + manual rescan
- Top senders report (top 20 by size)
- Recommendations view ranked by potential space savings
- Multi-select workflow (single, select all, select by sender)
- Delete preview modal (count, total size, affected senders)
- Delete to Trash (batch Gmail API with retry/backoff, progress state, error handling)

Planned next:

- Undo delete
- Sender whitelist
- Settings and export

## Tech stack

- Next.js 16 (App Router)
- TypeScript 5 (strict)
- NextAuth.js v5 (Google OAuth)
- Tailwind CSS 4 + DaisyUI 5
- Vitest + Playwright

## Architecture

This project follows Clean Architecture + DDD + SOLID:

```
src/
├── domain/           # business rules, value objects, repository contracts
├── application/      # use cases + DTOs
├── infrastructure/   # Gmail adapters, auth, DI
├── presentation/     # pages, components, hooks
└── shared/           # cross-cutting utilities and types
```

Dependency direction is enforced with ESLint boundaries:

`presentation -> application -> domain <- infrastructure`

## Privacy and security

- Metadata only: no email body content is persisted
- OAuth tokens are kept server-side and are not exposed in client session payloads
- Gmail calls include retry/backoff behavior in adapters

## Local setup

### 1) Prerequisites

- Node.js 22+
- pnpm 10+
- Google OAuth credentials (Web application)

### 2) Configure environment

```bash
cp .env.example .env
```

Set values in `.env`:

- `AUTH_SECRET` (generate with `npx auth secret`)
- `AUTH_GOOGLE_ID`
- `AUTH_GOOGLE_SECRET`

For Google OAuth, add this redirect URI in Google Cloud Console:

- `http://localhost:3000/api/auth/callback/google`

### 3) Install and run

```bash
pnpm install
pnpm dev
```

Open `http://localhost:3000`.

## Scripts

```bash
pnpm dev       # start dev server
pnpm build     # production build
pnpm lint      # ESLint
pnpm format    # Prettier
pnpm test      # Vitest
pnpm test:e2e  # Playwright
```

## Testing

- Application and domain logic: unit tests
- Infrastructure adapters: integration-style tests with mocked providers
- Presentation flows: Playwright end-to-end tests

## Documentation

- `docs/PRD.md` - product requirements + iteration plan
- `docs/TECH_STACK.md` - technical stack details
- `docs/DEFINITION_OF_DONE.md` - delivery quality gates

## License

MIT
