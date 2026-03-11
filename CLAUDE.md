# Clean Gmail — CLAUDE.md

## Project Overview

Web app that connects to Gmail via the Gmail API, analyzes emails, and recommends deletions to free storage. Built with Clean Architecture, DDD, and SOLID principles.

## Tech Stack

- **Framework:** Next.js 16.1 (App Router)
- **Language:** TypeScript 5.x (strict mode)
- **Runtime:** Node.js 22.x LTS
- **Package Manager:** pnpm 10.x
- **Styling:** Tailwind CSS 4.x + DaisyUI 5.x
- **State:** React Server Components + TanStack React Query 5.x
- **Database:** PostgreSQL 16.x + Prisma 6.x
- **Auth:** NextAuth.js (Auth.js) v5 with Google OAuth 2.0
- **Gmail:** googleapis Node.js client
- **Testing:** Vitest (unit/integration) + Playwright (E2E)
- **Linting:** ESLint 9.x (flat config) + Prettier + eslint-plugin-boundaries

## Architecture (Clean Architecture / DDD)

```
src/
├── domain/           # Enterprise rules — ZERO external deps
│   ├── entities/
│   ├── value-objects/
│   ├── repositories/  # Port interfaces
│   ├── services/
│   └── errors/
├── application/      # Use cases — depends only on Domain
│   ├── use-cases/
│   ├── dtos/
│   └── ports/        # Secondary port interfaces (e.g., EmailProvider)
├── infrastructure/   # Adapters — implements Domain/Application interfaces
│   ├── persistence/  # Prisma repos
│   ├── gmail/        # Gmail API adapter
│   ├── auth/         # NextAuth config
│   └── di/           # DI container
├── presentation/     # Next.js App Router — calls Application use cases
│   ├── app/          # Routes, layouts, pages
│   ├── components/   # UI only, no business logic
│   └── hooks/        # React Query hooks
└── shared/           # Cross-cutting: types, utils
```

### Dependency Rule

```
Presentation → Application → Domain ← Infrastructure
```

- Domain has ZERO external imports
- Application depends only on Domain
- Infrastructure implements interfaces from Domain/Application
- Presentation calls use cases from Application, never Infrastructure directly
- Enforced by eslint-plugin-boundaries

## Commands

```bash
pnpm dev          # Start dev server
pnpm build        # Production build
pnpm lint         # ESLint check
pnpm format       # Prettier format
pnpm test         # Run Vitest tests
pnpm test:e2e     # Run Playwright E2E tests
```

## Key Rules

- **No `any` types**, no `@ts-ignore`
- **No circular dependencies** (eslint-plugin-import enforced)
- **No fat interfaces** — keep them small and focused (e.g., `EmailReader`, `EmailDeleter`, not `EmailService`)
- **Each use case = single responsibility** — create new use cases, don't modify existing
- **Only metadata stored** — never email body content
- **OAuth tokens never in URLs, logs, or client-side code**
- **Gmail API rate limits** — retry with exponential backoff, batch up to 100
- **Parameterized Prisma queries** — no raw SQL
- **Feature branches** — never commit directly to `main`

## Testing Strategy

```
Application    → Unit tests (mock ports/repos — this is the PRIMARY test layer)
Domain         → Unit tests ONLY for value objects and domain services
                 Skip if already covered by application-layer tests
Infrastructure → Integration tests ONLY (request params, response shape, connectivity)
                 Do NOT duplicate use-case logic — test the adapter, not the business rules
Presentation   → E2E tests (Playwright)
```

### Testing Rules

- **Application layer is the main test surface** — all use-case logic is tested here with mocked ports
- **Avoid duplicate tests** — if a domain entity behavior is exercised by a use-case test, don't add a separate domain test
- **Domain tests are reserved for** value objects (validation, equality) and domain services (pure logic not invoked by a single use case)
- **Infrastructure tests verify integration only** — correct HTTP params sent, responses parsed, DB queries run, app boots. Never re-test use-case branches
- **No third-party calls in application tests** — mock all ports (DB, Gmail, etc.)
- **Infrastructure integration tests hit the real external service** — use test containers or sandbox APIs

## Iteration Completion Checklist

After implementing each iteration, you MUST complete every step below before committing:

1. `pnpm test` — all tests pass
2. `pnpm lint` — zero errors
3. `pnpm format` — formatting applied
4. **Browser smoke test using the Chrome extension:**
   - Start `pnpm dev` if not already running
   - Use `mcp__claude-in-chrome__*` tools to verify **every "Done when" criterion** from the iteration plan in the actual running app
   - Each criterion must be tested explicitly — navigate to the relevant URL, interact with the UI, assert the outcome
   - Record a GIF of the full smoke test using `mcp__claude-in-chrome__gif_creator`
5. Commit only after all of the above pass

## Iteration Plan

22 micro-iterations defined in `docs/PRD.md`. Current status: **Pre-iteration 1** (project not yet initialized).

## Docs

- `docs/PRD.md` — Full PRD with 22 iterations
- `docs/TECH_STACK.md` — Detailed tech stack and architecture
- `docs/DEFINITION_OF_DONE.md` — DoD checklist per iteration
