# Meta Prompt — Iteration Planning

Use this prompt to plan any iteration from the PRD. Replace `{{ITERATION_NUMBER}}` with the target iteration (e.g., `1`, `5`, `14`).

---

## Prompt

```
Plan the implementation of Iteration {{ITERATION_NUMBER}} from the PRD.

Before planning, read and internalize the following files in order:

1. `docs/PRD.md` — Read the full iteration {{ITERATION_NUMBER}} section (goal, tasks, "Done when" criteria). Also read adjacent iterations to understand what exists before and what comes after.
2. `docs/TECH_STACK.md` — Understand the stack, project structure, Clean Architecture layers, dependency rule, and SOLID mapping.
3. `docs/DEFINITION_OF_DONE.md` — Every checklist item that applies to this iteration MUST be addressed in the plan.
4. `CLAUDE.md` — Follow all key rules, architecture constraints, and testing strategy.

Then produce a step-by-step implementation plan that covers:

### 1. Scope Analysis
- What exactly does this iteration deliver?
- What layers of the architecture are affected (domain, application, infrastructure, presentation)?
- What already exists from previous iterations that this builds on?
- What is explicitly OUT of scope (deferred to later iterations)?

### 2. Domain Layer Changes
- New entities, value objects, or domain services needed
- New repository port interfaces (if any)
- New domain errors (if any)
- Ensure: zero external imports, pure business logic only

### 3. Application Layer Changes
- New use cases (one per responsibility)
- New DTOs (input/output)
- New port interfaces for external services (if any)
- Ensure: depends only on domain, no framework imports

### 4. Infrastructure Layer Changes
- New adapter implementations (Gmail, Prisma, auth)
- New Prisma schema changes / migrations (if any)
- DI container wiring for new interfaces
- Ensure: implements domain/application interfaces only

### 5. Presentation Layer Changes
- New pages, routes, or layouts
- New components (UI only, no business logic)
- New React Query hooks
- Loading, error, and empty states (if UI is involved)
- Responsive design considerations

### 6. Testing Plan
Follow the project testing strategy strictly:
- **Application layer**: List every use case and the test scenarios (happy path, edge cases, error cases). Mock all ports. This is the PRIMARY test layer.
- **Domain layer**: Only if new value objects or domain services are introduced AND they are not already covered by application tests.
- **Infrastructure layer**: Only integration concerns — verify correct request params, response parsing, connectivity. Do NOT re-test use-case logic.
- **Presentation layer**: E2E tests with Playwright for new user-facing flows (if any).
- Flag any potential duplicate tests and explain why they are avoided.

### 7. Definition of Done Checklist
Go through every item in `docs/DEFINITION_OF_DONE.md` and for each:
- Mark it as **applicable** or **not applicable** (with reason)
- For applicable items, describe how the plan satisfies it

### 8. File List
List every file that will be created or modified, organized by layer:
- `src/domain/...`
- `src/application/...`
- `src/infrastructure/...`
- `src/presentation/...`
- `src/__tests__/...`
- `prisma/...` (if applicable)

### 9. Implementation Order
Provide a numbered sequence of steps to implement, respecting the dependency rule:
- Domain first (entities, VOs, ports)
- Application second (use cases, DTOs)
- Infrastructure third (adapters, DB)
- Presentation last (UI, hooks, pages)
- Tests alongside each layer

### Constraints
- Follow the dependency rule: Presentation → Application → Domain ← Infrastructure
- No `any` types, no `@ts-ignore`
- No fat interfaces — keep them small and focused
- Each use case = single responsibility
- Only metadata stored — never email body content
- OAuth tokens never exposed in URLs, logs, or client-side code
- Feature branch — never commit directly to main
- Do not add code, tests, or features beyond what this iteration requires
```
