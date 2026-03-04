# Definition of Done — Clean Gmail

Every iteration is considered **done** only when ALL applicable criteria below are met.

---

## Code Quality

- [ ] TypeScript strict mode — zero `any` types, no `@ts-ignore`
- [ ] ESLint passes with zero errors (`pnpm lint`)
- [ ] Prettier formatting applied (`pnpm format`)
- [ ] No circular dependencies (enforced by `eslint-plugin-import`)
- [ ] Husky pre-commit hook passes (lint-staged runs on staged files)

## Clean Architecture Compliance

- [ ] Domain layer has zero external imports (no Next.js, no Prisma, no googleapis)
- [ ] Application layer imports only from Domain
- [ ] Infrastructure implements interfaces defined in Domain/Application (ports & adapters)
- [ ] Presentation layer calls use cases from Application — never accesses Infrastructure directly
- [ ] `eslint-plugin-boundaries` passes with zero violations

## SOLID Compliance

- [ ] Each new use case has a single responsibility
- [ ] Existing use cases are not modified to add new behavior — new use cases are created instead
- [ ] New external integrations implement existing port interfaces
- [ ] No fat interfaces — interfaces are small and focused (`EmailReader`, `EmailDeleter`, not `EmailService`)
- [ ] Dependencies point inward (concrete depends on abstract, not the reverse)

## Testing

- [ ] **Application layer** — Unit tests with Vitest (mock ports/repos) — all use-case logic tested here
- [ ] **Domain layer** — Unit tests ONLY for new value objects or domain services not already covered by application tests
- [ ] **Infrastructure layer** — Integration tests ONLY for adapter concerns (request params, response parsing, connectivity) — do NOT duplicate use-case logic
- [ ] **Presentation layer** — E2E tests with Playwright for new user-facing flows
- [ ] No duplicate tests across layers
- [ ] Application tests mock all external dependencies (no real DB or third-party calls)
- [ ] Infrastructure integration tests hit real services (test containers / sandbox APIs)
- [ ] All tests pass (`pnpm test`)
- [ ] Coverage does not decrease from previous iteration

## Functionality

- [ ] Feature works as described in the iteration's "Done when" criteria in the PRD
- [ ] Loading state handled (spinner/skeleton)
- [ ] Error state handled (error banner with actionable message)
- [ ] Empty state handled (meaningful message when no results)
- [ ] Responsive layout — works on mobile (375px) and desktop (1440px)

## Security

- [ ] OAuth tokens never exposed in URLs, logs, or client-side code
- [ ] Only metadata stored (sender, size, date, labels) — never email body content
- [ ] Gmail API scopes are minimal (`gmail.readonly` unless deletion is needed)
- [ ] No secrets in source code or version control
- [ ] Prisma queries use parameterized inputs (no raw SQL injection)

## Data & API

- [ ] Gmail API rate limits respected (retry with exponential backoff)
- [ ] Batch requests used where possible (up to 100 per batch)
- [ ] Database migrations are up to date (`pnpm prisma migrate dev`)
- [ ] No N+1 queries in Prisma calls

## Git & Version Control

- [ ] Changes committed on a feature branch (not directly on `main`)
- [ ] Commit messages are descriptive (what + why)
- [ ] No unrelated changes included in the commit
- [ ] Branch is rebased on latest `main` before merge

## Documentation

- [ ] New domain entities/value objects have JSDoc on public methods
- [ ] New API routes have input/output types documented via TypeScript types
- [ ] Breaking changes to existing interfaces are noted in the PR description
- [ ] `CLAUDE.md` updated if architecture, commands, rules, or tech stack changed
- [ ] `README.md` updated if features, setup steps, or project overview changed
- [ ] `docs/PRD.md` iteration status updated if an iteration was completed
- [ ] `docs/TECH_STACK.md` updated if dependencies or architecture decisions changed

---

## Checklist Usage

Copy the applicable sections into your PR description. Not every item applies to every iteration:

- **Iteration adds no UI?** → Skip Presentation testing and responsive checks
- **Iteration adds no DB changes?** → Skip migration and N+1 checks
- **Iteration adds no deletion?** → Skip `gmail.modify` scope check
- **Iteration is domain-only?** → Focus on unit tests and architecture compliance
