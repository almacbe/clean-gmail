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
Domain       → Unit tests (pure logic, no mocks)
Application  → Unit tests (mock repository/port interfaces)
Infrastructure → Integration tests (real DB)
Presentation → E2E tests (Playwright)
```

## Iteration Plan

22 micro-iterations defined in `docs/PRD.md`. Current status: **Pre-iteration 1** (project not yet initialized).

## Docs

- `docs/PRD.md` — Full PRD with 22 iterations
- `docs/TECH_STACK.md` — Detailed tech stack and architecture
- `docs/DEFINITION_OF_DONE.md` — DoD checklist per iteration
