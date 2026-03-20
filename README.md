# AIGuidebook — Logging & Risk Engine

Students log AI tool usage against assignments, submit declarations, and the system classifies risk and flags discrepancies.

Built for TDT4242 at NTNU, Group 17.

## Prerequisites

- [Bun](https://bun.sh/) (v1.3+)
- PostgreSQL (via [Podman](https://podman.io/) or Docker)

## Setup

```bash
# Start Postgres
podman compose up -d

# Install dependencies
bun install

# Push schema to database
bun run db:push

# Seed demo data (students + assignments)
bun run db:seed
```

## Run

```bash
# Development (API + frontend + type watcher)
bun run dev
```

Open http://localhost:5173. In dev mode it auto-logs in as the seed student.

Seed accounts:
- **Student:** student@ntnu.no / password123
- **Admin:** admin@ntnu.no / password123

```bash
# Production
bun run build
bun run start
```

## Test

Install dependencies first (`bun install`). Backend tests live under `tests/` only; E2E uses Playwright separately.

```bash
bun run test
# same as: bun test tests
```

38 backend tests covering all requirements (RE-09 through RE-16). Use **`bun run test`** or **`bun test tests`** so Playwright files under `e2e/` are not picked up by Bun’s runner.

**Supplementary checks (Task 3.1 non-`bun test` cases):**

```bash
# API scripts: TC-RE12-05, TC-NFR-01/02, TC-NFR-SEC-01
bun run test:manual

# Or individually: test:manual:re12-05 | test:manual:nfr | test:manual:sec
```

**Playwright (TC-SYS-*):** with `bun run dev` running, `bunx playwright install` once, then `bun run test:e2e`. See `e2e/README.md` and `scripts/manual-tests/README.md`.

## Lint

```bash
bun run lint
```

## Other Commands

| Command | Description |
|---------|-------------|
| `bun run api-types` | Regenerate frontend types from OpenAPI spec |
| `bun run db:push` | Push Drizzle schema to Postgres |
| `bun run db:seed` | Seed demo users and assignments |
| `bun run db:studio` | Open Drizzle Studio (DB browser) |

## Stack

Hono + @hono/zod-openapi, Drizzle ORM + PostgreSQL, SolidJS + Tailwind CSS, Bun

See [decisions.md](decisions.md) for architecture details and [REQUIREMENTS.md](REQUIREMENTS.md) for the full specification.
