# E2E tests (TC-SYS-01 … TC-SYS-04)

1. Start stack: `bun run dev` (waits until `http://localhost:5173` serves the app).
2. First-time setup: `bunx playwright install chromium`
3. Run: `bun run test:e2e`

Optional: `E2E_BASE_URL=http://127.0.0.1:5173 bun run test:e2e`

In development, the app may auto-login as the seed student; tests handle both login form and logged-in shell where possible.

Specs use the usual **`*.spec.ts`** name under **`e2e/`** only. Root script **`bun test tests`** runs the backend suite in `tests/` only, so Playwright files here are not picked up by Bun’s test runner.

Config is **`playwright.config.cjs`** (CommonJS) so Playwright does not use the ESM `*.esm.preflight` import path, which can fail when the CLI is started via Bun.

`testMatch` is set to a plain glob for `*.spec.ts` files (see `playwright.config.cjs`): Playwright’s built‑in default pattern uses extglob syntax that often matches **no files** with the bundled `minimatch`, which surfaces as **No tests found**.
