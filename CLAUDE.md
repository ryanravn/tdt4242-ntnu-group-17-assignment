# CLAUDE.md

## Project

AIGuidebook — Logging & Risk Engine module. Students log AI tool usage against assignments, submit declarations, and the system classifies risk and flags discrepancies.

## Key Documents

These documents are interconnected. If one changes, check the others stay in sync.

- [REQUIREMENTS.md](REQUIREMENTS.md) — functional and non-functional requirements (RE-09 through RE-16, NFR-01, NFR-02)
- [decisions.md](decisions.md) — tech stack and architecture decisions
- [tasks/overview.md](tasks/overview.md) — project and course description
- [tasks/2.1-prompting-strategy.md](tasks/2.1-prompting-strategy.md) — prompting strategy (references the selected requirements)
- [tasks/2.2-code-generation.md](tasks/2.2-code-generation.md) — code generation task description
- [tasks/1.1-requirements-elicitation.md](tasks/1.1-requirements-elicitation.md) — original interviews and full requirement list
- [tasks/1.3-requirement-dependency-analysis-and-categorization.md](tasks/1.3-requirement-dependency-analysis-and-categorization.md) — dependency graph

## Stack

Hono + @hono/zod-openapi | Drizzle ORM + PostgreSQL | SolidJS + TanStack Router + Kobalte + Tailwind | Bun

## Testing

Backend-first TDD with strict red-green-refactor:

1. Write **one** failing test (`bun test tests/foo.test.ts`)
2. Verify it fails for the right reason (feature missing, not typo)
3. Write **minimal** code to make it pass
4. Verify green, then lint (`bun run lint`)
5. Refactor if needed, stay green
6. Next test

Tests use `app.request()` directly against the Hono app (no HTTP server, no openapi-fetch). Bun test runner.

## Development Order

1. **Backend TDD** — all API routes tested and green (RE-09 through RE-16)
2. **Generate types** — `bun run api-types` to create `client/lib/api-types.d.ts` from the OpenAPI spec
3. **Frontend** — SolidJS UI consuming the verified API via typed fetch wrapper

## Project Layout

- `server/` — Hono backend (routes, services, db, auth)
- `client/` — SolidJS frontend (routes, components, lib)
- `tests/` — backend TDD tests
- `scripts/` — type generation tooling
- Single `package.json` at root

## Commands

- `bun run dev` — API + Vite + type watcher (concurrently)
- `bun test` — run backend tests
- `bun run api-types` — regenerate frontend types from OpenAPI spec
- `bun run db:push` — push Drizzle schema to Postgres
- `bun run db:seed` — seed demo data

## Conventions

- Single project, not a monorepo
- Scaffold with CLI tools (`bunx create-hono`, `bunx create-vite`) instead of generating boilerplate from scratch
- Pre-seeded students and assignments (no CRUD for those)
- Simple auth via Hono + Postgres
- API routes use `OpenAPIHono` + `createRoute()` with Zod schemas
- Frontend types auto-generated from `/openapi` endpoint via `openapi-typescript`
