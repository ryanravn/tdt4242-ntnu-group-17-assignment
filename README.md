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

```bash
bun test
```

38 backend tests covering all requirements (RE-09 through RE-16).

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
