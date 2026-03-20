/* eslint-disable @typescript-eslint/no-require-imports -- Playwright CJS config (avoids ESM ".esm.preflight" loader). */
const path = require("path");
const { defineConfig, devices } = require("@playwright/test");

/**
 * TC-SYS-* — run `bun run dev` first so Vite (5173) + API are up.
 * Install browsers: `bunx playwright install chromium`
 *
 * Use **.cjs** so Playwright loads the config with `require()` instead of the
 * ESM path that imports `*.esm.preflight` (breaks under Bun / some Node setups).
 */
module.exports = defineConfig({
  testDir: path.join(__dirname, "e2e"),
  // Playwright default testMatch uses extglob (@(spec test)…); minimatch often does not match it → "No tests found".
  testMatch: "**/*.spec.ts",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: "list",
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:5173",
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
