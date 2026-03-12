# Meta Prompt - Iteration Planning

Use this prompt to plan any PRD iteration with OpenCode + GPT-5.3 Codex. Replace `{{ITERATION_NUMBER}}` with the target iteration (for example: `1`, `5`, `14`).

## How to invoke

```txt
Run this as a planning-only prompt (no code edits, no commit).
```

---

## Prompt

```txt
Plan the implementation of Iteration {{ITERATION_NUMBER}} from the PRD.

Execution mode:
- Planning only. Do not edit files, do not run migrations, do not commit.
- If information is missing, infer the safest default from repo conventions and state assumptions.
- Ask at most one blocking question only if ambiguity materially changes architecture/scope.

Before planning, read and internalize these files in order:

1. `AGENTS.md` - source of truth for architecture boundaries, import rules, security/privacy constraints, and quality gates.
2. `docs/PRD.md` - read Iteration {{ITERATION_NUMBER}} in full (goal, tasks, done criteria) plus adjacent iterations for context.
3. `docs/TECH_STACK.md` - stack constraints, structure, and implementation conventions.
4. `docs/DEFINITION_OF_DONE.md` - every applicable checklist item must be mapped in the plan.
5. `CLAUDE.md` - use as supplemental context if anything is not covered above.

Output contract:
- Be concise and implementation-oriented.
- Focus on actionable steps and exact files.
- Do not paste large code snippets.
- Include explicit assumptions and risks.

Produce the plan with the following sections:

1) Scope Analysis
- What this iteration delivers (in/out of scope).
- Which layers are affected (domain/application/infrastructure/presentation).
- Dependencies on previous iterations and expectations for following iterations.

2) Architecture and Boundary Check
- Validate against dependency rule: Presentation -> Application -> Domain <- Infrastructure.
- Identify forbidden import risks before implementation.
- Specify required ports/contracts and where they live.

3) Domain Layer Plan
- New entities/value objects/domain services/errors (if any).
- New repository interfaces/ports (if any).
- Invariants and business rules to enforce.

4) Application Layer Plan
- New use cases (single responsibility each).
- Input/output DTOs.
- Application ports for external dependencies.
- Error mapping strategy (domain/app errors to caller-friendly outcomes).

5) Infrastructure Layer Plan
- Adapter implementations (Prisma, Gmail, Auth, etc.).
- Schema/migration impact (if applicable).
- Retry/backoff and batching implications for Gmail integrations.
- DI/container wiring changes.

6) Presentation Layer Plan
- Routes/pages/components/hooks to add or update.
- State/query flow and UI states (loading/error/empty/success).
- Responsive behavior and accessibility checks for new UI.

7) Test Plan (Layer-Correct)
- Application tests (primary): list scenarios per use case (happy path, edge, failure).
- Domain tests: only for new value objects/domain services not already covered through application tests.
- Infrastructure tests: integration-only contract checks; avoid business-logic duplication.
- Presentation tests: Playwright E2E for user-facing flows.
- Explicitly call out duplicate-test risks and how to avoid them.

8) Definition of Done Mapping
- For each item in `docs/DEFINITION_OF_DONE.md`: mark Applicable / Not Applicable.
- For applicable items, explain exactly how the implementation plan satisfies it.

9) File Plan
- List exact files to create/modify, grouped by layer:
  - `src/domain/...`
  - `src/application/...`
  - `src/infrastructure/...`
  - `src/presentation/...`
  - `src/**/__tests__/...` or `tests/...`
  - `prisma/...` (if needed)

10) Ordered Implementation Steps
- Provide a numbered sequence with dependency-safe order:
  1. Domain
  2. Application
  3. Infrastructure
  4. Presentation
  5. Tests and quality gates
- Include quick verification checkpoints after each major step.

11) Ready-to-Execute Handoff
- A short "Implementation Brief" with:
  - iteration goal
  - top 3 technical decisions
  - first 3 files to touch
  - first command(s) to run

Hard constraints:
- No `any`, no `@ts-ignore`, no circular dependencies.
- Keep interfaces small and cohesive.
- One use case per responsibility.
- Persist metadata only; never email body content.
- Never expose OAuth tokens in URL/log/client.
- Do not propose features beyond this iteration.
- Assume feature branch workflow; never direct-to-main.
```
