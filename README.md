# Clean Gmail

Web app that connects to your Gmail account, analyzes your emails, and recommends which ones to delete to free up storage space.

## Problem

Gmail accounts accumulate years of emails — newsletters, promotions, large attachments — silently eating into Google storage. Clean Gmail helps you identify and remove what you don't need.

## Features (Planned)

- Sign in with Google OAuth 2.0
- Scan for large emails, promotions, social notifications, and old emails
- Dashboard with cleanup recommendations ranked by impact
- Select and bulk-trash emails with undo support
- Top senders report
- Export results as JSON/CSV
- Whitelist senders to protect from deletion suggestions

## Tech Stack

- **Framework:** Next.js 16.1 (App Router)
- **Language:** TypeScript 5.x (strict mode)
- **Database:** PostgreSQL 16.x + Prisma 6.x
- **Auth:** NextAuth.js v5 (Google OAuth 2.0)
- **Styling:** Tailwind CSS 4.x + DaisyUI 5.x
- **Testing:** Vitest + Playwright

## Architecture

Built with Clean Architecture, DDD, and SOLID principles:

```
src/
├── domain/           # Business rules, entities, ports (zero external deps)
├── application/      # Use cases, DTOs
├── infrastructure/   # Gmail API adapter, Prisma repos, auth config
├── presentation/     # Next.js pages, components, hooks
└── shared/           # Cross-cutting types and utils
```

## Getting Started

```bash
# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env

# Run database migrations
pnpm prisma migrate dev

# Start dev server
pnpm dev
```

## Development

```bash
pnpm dev          # Start dev server
pnpm build        # Production build
pnpm lint         # ESLint check
pnpm format       # Prettier format
pnpm test         # Run unit/integration tests
pnpm test:e2e     # Run E2E tests
```

## Docs

- [PRD & Iteration Plan](docs/PRD.md)
- [Tech Stack](docs/TECH_STACK.md)
- [Definition of Done](docs/DEFINITION_OF_DONE.md)

## License

MIT
