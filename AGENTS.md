# AGENTS.md

## Purpose

This repository powers **Clean Gmail**, a web app that connects to Gmail, analyzes email metadata, and recommends deletions to free storage.

All agents must preserve **Clean Architecture + DDD + SOLID** and respect strict layer boundaries.

---

## Project Snapshot

- Framework: `Next.js 16.1` (App Router)
- Language: `TypeScript 5.x` (strict mode)
- Runtime: `Node.js 22.x LTS`
- Package manager: `pnpm 10.x`
- Styling: `Tailwind CSS 4.x` + `DaisyUI 5.x`
- State/data-fetching: React Server Components + `TanStack React Query 5.x`
- Database: `PostgreSQL 16.x` + `Prisma 6.x`
- Auth: `NextAuth.js (Auth.js) v5` with Google OAuth 2.0
- Gmail integration: `googleapis` Node client
- Tests: `Vitest` + `Playwright`
- Lint/format: `ESLint 9` (flat config), `Prettier`, `eslint-plugin-boundaries`

---

## Architecture (Non-Negotiable)

Directory intent:

- `src/domain/` - enterprise rules, **zero external dependencies**
- `src/application/` - use cases, depends only on domain
- `src/infrastructure/` - adapters implementing domain/application ports
- `src/presentation/` - UI/routes/hooks, consumes application use cases
- `src/shared/` - cross-cutting utilities/types

Dependency rule:

`Presentation -> Application -> Domain <- Infrastructure`

---

## Allowed Imports Matrix

Use this matrix before adding any import.

| From \ To      |  domain  | application | infrastructure | presentation | shared | external libs |
| -------------- | :------: | :---------: | :------------: | :----------: | :----: | :-----------: |
| domain         |    ✅    |     ❌      |       ❌       |      ❌      |  ✅\*  |      ❌       |
| application    |    ✅    |     ✅      |       ❌       |      ❌      |   ✅   | ✅ (minimal)  |
| infrastructure |    ✅    |     ✅      |       ✅       |      ❌      |   ✅   |      ✅       |
| presentation   |  ✅\*\*  |     ✅      |       ❌       |      ✅      |   ✅   |      ✅       |
| shared         | ❌\*\*\* |  ❌\*\*\*   |    ❌\*\*\*    |   ❌\*\*\*   |   ✅   | ✅ (utility)  |

Notes:

- `✅*` Domain may import from `shared` only if `shared` is framework-agnostic and business-safe.
- `✅**` Presentation should typically access Domain through Application contracts; direct Domain usage should be rare.
- `❌***` `shared` must stay independent; it should not import from feature layers.

If unsure, prefer creating interfaces in Domain/Application and implementing them in Infrastructure.

---

## Engineering Rules

- No `any`
- No `@ts-ignore`
- No circular dependencies
- Keep interfaces small and focused (no "god interfaces")
- Each use case has a single responsibility
- Prefer adding a new use case over expanding an unrelated one
- Use parameterized Prisma access only (no raw SQL shortcuts)
- Use feature branches; never commit directly to `main`

---

## Security & Privacy Rules

- Store **metadata only**; never persist email body content.
- OAuth tokens must never appear in:
  - URLs
  - logs
  - client-side code
- Gmail API usage:
  - exponential backoff on retries
  - batch up to 100 where applicable

---

## Testing Strategy

Primary test surface is the **Application layer**.

- Application: unit tests with mocked ports/repos
- Domain: unit tests for value objects/domain services only when needed
- Infrastructure: integration tests for adapter behavior (I/O contracts, connectivity)
- Presentation: E2E tests with Playwright

Testing principles:

- Avoid duplicate tests across layers.
- No third-party calls in application tests.
- Infrastructure tests validate integration mechanics, not business branching.

---

## Commands

```bash
pnpm dev
pnpm build
pnpm lint
pnpm format
pnpm test
pnpm test:e2e
```

---

## Definition of Ready (for any code change)

Before implementation begins:

- Target layer is clear (`domain` / `application` / `infrastructure` / `presentation`)
- Required ports/contracts are identified
- Data privacy impact reviewed (metadata-only rule)
- Test layer(s) selected according to testing strategy

---

## Definition of Done (per iteration)

All must pass before commit:

1. `pnpm test`
2. `pnpm lint`
3. `pnpm format`
4. Browser smoke test in running app:
   - start `pnpm dev`
   - verify every "Done when" criterion from iteration plan
   - capture smoke-test artifacts (screenshots/video/trace) with browser automation tooling
5. stop dev server (`pkill -f "next dev"` or equivalent)
6. commit only after all above succeed

---

## PR Checklist Template

Copy into every PR description.

```md
## Why

- [ ] Clear business reason for this change
- [ ] Scope matches one focused concern

## Architecture

- [ ] Layer boundaries respected (`Presentation -> Application -> Domain <- Infrastructure`)
- [ ] No forbidden imports introduced
- [ ] New interfaces/ports are minimal and cohesive

## Security & Privacy

- [ ] No email body content persisted
- [ ] No OAuth secrets in URL/log/client
- [ ] Gmail rate-limit handling considered (retry/backoff/batching)

## Testing

- [ ] Tests added/updated in correct layer(s)
- [ ] Application logic tested with mocked ports
- [ ] No duplicate cross-layer test coverage

## Quality Gates

- [ ] `pnpm test` passes
- [ ] `pnpm lint` passes (0 errors)
- [ ] `pnpm format` applied
- [ ] Browser smoke test completed against Done criteria
- [ ] Smoke test GIF attached/referenced

## Notes

- [ ] Tradeoffs/known limitations documented
- [ ] Follow-up tasks listed (if any)
```

---

## Current Delivery State

- Iteration plan: 22 micro-iterations in `docs/PRD.md`
- Current status: **Pre-iteration 1**

---

## Reference Docs

- `docs/PRD.md`
- `docs/TECH_STACK.md`
- `docs/DEFINITION_OF_DONE.md`
