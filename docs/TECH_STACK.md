# Tech Stack Document — Clean Gmail

## Overview

Full-stack web application that connects to the Gmail API, built with **Clean Architecture**, **DDD**, and **SOLID** principles.

---

## Core Stack

| Category            | Technology           | Version           |
| ------------------- | -------------------- | ----------------- |
| **Framework**       | Next.js (App Router) | 16.1.x            |
| **Language**        | TypeScript           | 5.x (strict mode) |
| **Runtime**         | Node.js              | 22.x LTS          |
| **Package Manager** | pnpm                 | 10.x              |

---

## Frontend

| Category           | Technology               | Purpose                                                  |
| ------------------ | ------------------------ | -------------------------------------------------------- |
| **Styling**        | Tailwind CSS 4.x         | Utility-first CSS                                        |
| **Components**     | DaisyUI 5.x              | Tailwind component plugin (themes, pre-built components) |
| **State (server)** | React Server Components  | Server-side data fetching, no client JS                  |
| **State (client)** | TanStack React Query 5.x | Client-side caching, mutations, background refetching    |

---

## Backend & Data

| Category              | Technology                                           | Purpose                                            |
| --------------------- | ---------------------------------------------------- | -------------------------------------------------- |
| **API**               | Next.js App Router (Route Handlers + Server Actions) | API endpoints and server mutations                 |
| **Database**          | PostgreSQL 16.x                                      | Relational data persistence                        |
| **ORM**               | Prisma 6.x                                           | Type-safe DB access, migrations, schema management |
| **Authentication**    | NextAuth.js (Auth.js) v5                             | OAuth 2.0 with Google provider                     |
| **Gmail Integration** | Google APIs Node.js Client (`googleapis`)            | Gmail API access via OAuth tokens                  |

---

## Code Quality & Linting

| Tool                         | Purpose                                                                                          |
| ---------------------------- | ------------------------------------------------------------------------------------------------ |
| **ESLint 9.x** (flat config) | Static analysis, code quality rules                                                              |
| **Prettier**                 | Opinionated code formatting                                                                      |
| **typescript-eslint**        | TypeScript-specific lint rules                                                                   |
| **eslint-plugin-import**     | Enforce import order and prevent circular dependencies                                           |
| **eslint-plugin-boundaries** | **Enforce Clean Architecture layer boundaries** (domain cannot import from infrastructure, etc.) |
| **Husky**                    | Git hooks (run linting/tests on pre-commit)                                                      |
| **lint-staged**              | Run linters only on staged files for fast feedback                                               |

---

## Testing

| Layer                 | Tool                 | Scope                                                 |
| --------------------- | -------------------- | ----------------------------------------------------- |
| **Unit tests**        | Vitest               | Domain entities, value objects, application use cases |
| **Integration tests** | Vitest               | Repositories, API routes, services with DB            |
| **E2E tests**         | Playwright           | Full user flows through the browser                   |
| **Coverage**          | Vitest (v8 provider) | Coverage reporting with thresholds                    |

### Testing Strategy by Architecture Layer

```
Application Layer  → Unit tests (mock ports/repos) — PRIMARY test layer for all use-case logic
Domain Layer       → Unit tests ONLY for value objects and domain services
                     Skip if behavior is already covered by application-layer tests
Infrastructure     → Integration tests ONLY (verify request params, response parsing, connectivity)
                     Do NOT re-test use-case logic here — test the adapter, not the business rules
Presentation       → E2E tests (Playwright)
```

**Key principles:**

- The application layer is the main test surface — all business logic branches are tested here
- Avoid duplicate tests across layers; if a domain behavior is exercised by an application test, no separate domain test is needed
- Application tests mock all external dependencies (DB, Gmail API) via port interfaces
- Infrastructure tests hit real external services (test containers, sandbox APIs) but only verify integration concerns: correct parameters sent, responses parsed, service reachable
- Domain tests are reserved for value objects (validation, equality, immutability) and domain services with pure logic not tied to a single use case

---

## Project Structure (Clean Architecture / DDD)

```
src/
├── domain/                    # Enterprise Business Rules
│   ├── entities/              # Domain entities (e.g., Email, Label, Thread)
│   ├── value-objects/         # Value objects (e.g., EmailAddress, Subject)
│   ├── repositories/          # Repository interfaces (ports)
│   ├── services/              # Domain services (pure business logic)
│   └── errors/                # Domain-specific errors
│
├── application/               # Application Business Rules
│   ├── use-cases/             # Use case implementations (e.g., CleanInbox, ArchiveEmails)
│   ├── dtos/                  # Data Transfer Objects (input/output)
│   └── ports/                 # Secondary port interfaces (e.g., EmailProvider)
│
├── infrastructure/            # Frameworks & Drivers
│   ├── persistence/           # Prisma repositories (implements domain/repositories)
│   │   ├── prisma/            # Prisma schema, migrations, client
│   │   └── repositories/     # Concrete repository implementations
│   ├── gmail/                 # Gmail API adapter (implements application/ports)
│   ├── auth/                  # NextAuth.js configuration
│   └── di/                    # Dependency injection container
│
├── presentation/              # Interface Adapters (Next.js App Router)
│   ├── app/                   # Next.js app directory (routes, layouts, pages)
│   │   ├── (auth)/            # Auth-related routes (login, callback)
│   │   ├── (dashboard)/       # Protected routes
│   │   ├── api/               # Route Handlers
│   │   ├── layout.tsx         # Root layout
│   │   └── page.tsx           # Landing page
│   ├── components/            # React components (UI only, no business logic)
│   │   ├── ui/                # Generic UI components
│   │   └── features/          # Feature-specific components
│   └── hooks/                 # React Query hooks and client-side hooks
│
├── shared/                    # Cross-cutting concerns
│   ├── types/                 # Shared TypeScript types
│   └── utils/                 # Pure utility functions
│
├── __tests__/                 # Test files mirroring src structure
│   ├── domain/
│   ├── application/
│   ├── infrastructure/
│   └── e2e/
│
prisma/
│   ├── schema.prisma          # Database schema
│   └── migrations/            # Database migrations
│
├── .eslintrc.js               # ESLint flat config
├── .prettierrc                # Prettier config
├── tsconfig.json              # TypeScript strict config
├── vitest.config.ts           # Vitest config
├── playwright.config.ts       # Playwright config
└── package.json
```

---

## Dependency Rule (Clean Architecture)

```
Presentation → Application → Domain ← Infrastructure
                    ↑                       |
                    └───────────────────────┘
```

- **Domain** has ZERO external dependencies (no framework, no DB, no Gmail)
- **Application** depends only on Domain
- **Infrastructure** implements interfaces defined in Domain/Application
- **Presentation** orchestrates use cases from Application

This is enforced at two levels:

1. **eslint-plugin-boundaries** — lint-time errors if layers violate the dependency rule
2. **pnpm strict mode** — prevents phantom dependencies

---

## SOLID Principles Mapping

| Principle                     | How It's Applied                                                                                                      |
| ----------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| **S** — Single Responsibility | Each use case does one thing. Entities encapsulate one concept.                                                       |
| **O** — Open/Closed           | Use cases are extended by creating new ones, not modifying existing. Repository interfaces allow new implementations. |
| **L** — Liskov Substitution   | Gmail adapter and any future email provider implement the same `EmailProvider` port interface.                        |
| **I** — Interface Segregation | Small, focused interfaces (e.g., `EmailReader`, `EmailDeleter` instead of one large `EmailService`).                  |
| **D** — Dependency Inversion  | Domain defines interfaces (ports). Infrastructure provides implementations (adapters). Wired via DI container.        |

---

## Gmail API Integration Architecture

```
┌─────────────┐     ┌───────────────┐     ┌──────────────────┐
│ Presentation │────▶│  Application  │────▶│     Domain       │
│  (Next.js)   │     │  (Use Cases)  │     │  (Entities/Ports)│
└─────────────┘     └───────────────┘     └──────────────────┘
                           │                        ▲
                           │ calls                  │ implements
                           ▼                        │
                    ┌──────────────────────────────────┐
                    │        Infrastructure            │
                    │  ┌─────────────┐ ┌────────────┐  │
                    │  │ Gmail Adapter│ │Prisma Repos│  │
                    │  │ (googleapis)│ │(PostgreSQL) │  │
                    │  └─────────────┘ └────────────┘  │
                    └──────────────────────────────────┘
```

### Auth Flow

1. User signs in via NextAuth.js with Google OAuth 2.0
2. Scopes requested: `gmail.readonly`, `gmail.modify` (configurable per feature)
3. Access + Refresh tokens stored securely via NextAuth.js
4. Gmail adapter uses tokens to call Gmail API on behalf of the user

---

## TypeScript Configuration

Strict mode enabled with additional safety flags:

```jsonc
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "exactOptionalPropertyTypes": true,
    "forceConsistentCasingInFileNames": true,
  },
}
```

---

## Key Dependencies Summary

```jsonc
{
  // Core
  "next": "^16.1.0",
  "react": "^19.0.0",
  "typescript": "^5.7.0",

  // Styling
  "tailwindcss": "^4.0.0",
  "daisyui": "^5.0.0",

  // Data
  "prisma": "^6.0.0",
  "@prisma/client": "^6.0.0",
  "@tanstack/react-query": "^5.0.0",

  // Auth & Gmail
  "next-auth": "^5.0.0",
  "googleapis": "^144.0.0",

  // Dev / Quality
  "eslint": "^9.0.0",
  "prettier": "^3.0.0",
  "husky": "^9.0.0",
  "lint-staged": "^15.0.0",
  "eslint-plugin-boundaries": "^4.0.0",

  // Testing
  "vitest": "^3.0.0",
  "@playwright/test": "^1.49.0",
}
```

---

## Sources

- [Next.js 16.1 — Official Blog](https://nextjs.org/blog)
- [pnpm 10.x — Official Site](https://pnpm.io/)
- [Next.js Installation Docs](https://nextjs.org/docs/app/getting-started/installation)
- [pnpm Releases](https://github.com/pnpm/pnpm/releases)
