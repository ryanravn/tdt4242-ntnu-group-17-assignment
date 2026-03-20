import { test, expect } from "@playwright/test";

/**
 * Helper: ensure we are on the logged-in shell (nav bar visible).
 * In DEV mode the app auto-logs in as student, so we just wait for nav.
 * If the login form is shown instead (non-DEV or token cleared), fill it.
 */
async function ensureLoggedIn(
  page: import("@playwright/test").Page,
  email: string,
  password: string,
) {
  await page.goto("/");
  // Wait for either the nav bar or the login form to appear
  const logOutBtn = page.getByRole("button", { name: "Log out" });
  const logInBtn = page.getByRole("button", { name: "Log in" });
  await expect(logOutBtn.or(logInBtn)).toBeVisible({ timeout: 20_000 });

  if (await logInBtn.isVisible().catch(() => false)) {
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill(password);
    await logInBtn.click();
    await expect(logOutBtn).toBeVisible({ timeout: 10_000 });
  }
}

/**
 * Helper: log out, then log in as a different user.
 * Clears localStorage token so the DEV auto-login doesn't re-fire for the old user.
 */
async function switchUser(
  page: import("@playwright/test").Page,
  email: string,
  password: string,
) {
  // In DEV mode the app always auto-logs in as student, so the login form
  // never appears on its own. We let auto-login finish, click "Log out",
  // then race to fill the login form before the next auto-login completes.
  await page.goto("/");
  const logOutBtn = page.getByRole("button", { name: "Log out" });
  const logInBtn = page.getByRole("button", { name: "Log in" });

  // Wait for auto-login to finish (nav visible) or login form if DEV auto-login is off
  await expect(logOutBtn.or(logInBtn)).toBeVisible({ timeout: 20_000 });

  if (await logOutBtn.isVisible().catch(() => false)) {
    await logOutBtn.click();
  }

  await expect(logInBtn).toBeVisible({ timeout: 10_000 });
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await logInBtn.click();
  await expect(logOutBtn).toBeVisible({ timeout: 10_000 });
}

test.describe.configure({ timeout: 60_000 });

test("TC-SYS-01: shell loads (title / nav or login)", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("AIGuidebook").first()).toBeVisible({ timeout: 20_000 });
  const logUsage = page.getByRole("button", { name: "Log Usage" });
  const logIn = page.getByRole("button", { name: "Log in" });
  await expect(logUsage.or(logIn)).toBeVisible();
});

test("TC-SYS-02: Log Usage page reachable", async ({ page }) => {
  await ensureLoggedIn(page, "student@ntnu.no", "password123");
  await page.getByRole("button", { name: "Log Usage" }).click();
  await expect(page.getByText("Log AI Usage")).toBeVisible();
});

test("TC-SYS-03: Declaration page reachable", async ({ page }) => {
  await ensureLoggedIn(page, "student@ntnu.no", "password123");
  await page.getByRole("button", { name: "Declaration" }).click();
  await expect(page.getByRole("button", { name: "Submit Declaration" })).toBeVisible();
});

test("TC-SYS-04: Admin Classifications and Alerts reachable", async ({ page }) => {
  await switchUser(page, "admin@ntnu.no", "password123");
  await page.getByRole("button", { name: "Classifications" }).click();
  await expect(page.getByText("Risk Classifications")).toBeVisible();
  await page.getByRole("button", { name: "Alerts" }).click();
  await expect(page.getByText("High Risk Alerts")).toBeVisible();
});
