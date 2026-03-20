# Manual / supplementary test scripts (Task 3.1)

These scripts automate **non-bun-test** cases from `tasks/3.1-test-plan.md`.

**Prerequisites:** PostgreSQL running, `DATABASE_URL` set, schema pushed (`bun run db:push`), seed data (`bun run db:seed`).

**Run from repository root** (so `DATABASE_URL` and imports resolve).

| Script | Test ID(s) | Command |
|--------|------------|---------|
| `tc-re12-05-empty-logs.ts` | TC-RE12-05 | `bun run scripts/manual-tests/tc-re12-05-empty-logs.ts` |
| `tc-nfr-performance.ts` | TC-NFR-01, TC-NFR-02 | `bun run scripts/manual-tests/tc-nfr-performance.ts` |
| `tc-nfr-sec-student-access.ts` | TC-NFR-SEC-01 | `bun run scripts/manual-tests/tc-nfr-sec-student-access.ts` |
| `run-all-manual.ts` | Runs the three above | `bun run scripts/manual-tests/run-all-manual.ts` |

**TC-SYS-01 … TC-SYS-04** — browser E2E: start app (`bun run dev`), then in another terminal:

```bash
bunx playwright install   # first time only
bun run test:e2e
```

See `e2e/README.md`.

**TC-UNIT-01 / TC-UNIT-02** — not scripted; add real unit tests after extracting pure functions from `classifyDeclaration` / JWT helpers.
