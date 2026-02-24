# Architecture & Technology Decisions

## Overview

Single-project full-stack application. Hono serves both the REST API and the built SolidJS frontend. No monorepo, no separate services.

## Stack

| Layer | Choice | Why |
|-------|--------|-----|
| **Runtime** | Bun | Fast, built-in test runner, TypeScript native |
| **Backend** | Hono + `@hono/zod-openapi` | Lightweight, OpenAPI spec auto-generated from Zod schemas |
| **Database** | PostgreSQL + Drizzle ORM | Relational model fits the data (students, assignments, logs, declarations). Drizzle for type-safe queries and migrations |
| **Auth** | Simple session/JWT via Hono + Postgres | No external auth service. Students and admins are seeded. Basic login with hashed passwords |
| **Frontend** | SolidJS + Vite | Reactive, fast, small bundle |
| **Routing** | TanStack Router (SolidJS) | File-based, type-safe routing |
| **API Client** | `openapi-fetch` | Type-safe HTTP client generated from the OpenAPI spec |
| **UI Components** | Kobalte + CVA + tailwind-merge | shadcn-style components: Kobalte primitives, CVA for variants, `cn()` utility |
| **Container** | Podman (compose) | Postgres runs via `podman compose up -d` |
| **Styling** | Tailwind CSS | Utility-first, works with Kobalte |
| **Testing** | Bun test runner + `app.request()` | Backend-first TDD — tests call Hono directly, no HTTP server or generated client needed |

## Project Structure

```
/
├── server/              # Hono backend
│   ├── index.ts         # Hono app entry (OpenAPIHono), serves API + static frontend
│   ├── routes/          # API route handlers (one file per resource)
│   ├── services/        # Business logic (risk classification, comparison)
│   ├── db/              # Drizzle schema, migrations, seed data
│   └── lib/             # Auth, middleware, helpers
├── client/              # SolidJS frontend
│   ├── routes/          # TanStack Router file-based routes
│   ├── components/      # UI components
│   ├── lib/             # API client (openapi-fetch), auth context, generated types
│   ├── App.tsx          # Root component
│   └── index.tsx        # SolidJS entry point
├── tests/               # Backend tests (TDD, app.request())
├── scripts/             # Type generation, dev tooling
├── index.html           # Vite entry HTML
├── vite.config.ts       # Builds frontend, proxies /api to Hono in dev
├── drizzle.config.ts    # Drizzle ORM config
└── package.json         # Single package.json for everything
```

## Dev Setup

- `bun run dev` — starts Hono backend + Vite dev server (with proxy)
- `bun run test` — runs backend tests
- `bun run build` — Vite builds frontend to `dist/`, Hono serves it
- `bun run db:push` — push Drizzle schema to Postgres
- `bun run db:seed` — seed students and assignments

## Key Decisions

**Why single project, not monorepo?**
This is a course assignment MVP. A monorepo adds tooling complexity (Turborepo, workspace configs) with no benefit at this scale.

**Why Hono serves the frontend?**
One process, one port. In dev, Vite proxies API calls to Hono. In production, Hono serves the built static files and the API from the same server. Simple to run, simple to demo.

**Why backend-first TDD?**
Per our prompting strategy (task 2.1), we write failing backend tests first, then implement. The frontend is built last, consuming the verified API.

**Why `app.request()` instead of `openapi-fetch` for tests?**
Tests must work before any implementation exists. `openapi-fetch` is generated from the OpenAPI spec, which evolves as we add routes — tests that depend on it would break or need regenerating during red-green cycles. Instead, tests import the Hono app directly and call `app.request()`. No running server, no generated client, no spec dependency. Fast and self-contained.

**Why PostgreSQL over SQLite?**
The data model is relational (foreign keys between students, assignments, logs, declarations, classifications). PostgreSQL handles this cleanly and is what students will encounter professionally.

**Why pre-seeded data?**
The assignment doesn't require CRUD for students or assignments. We seed realistic demo data (a few students, a few assignments) so we can focus on the logging and risk engine features.
