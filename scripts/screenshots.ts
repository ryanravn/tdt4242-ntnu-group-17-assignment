import { chromium } from "playwright";

const BASE = "http://localhost:5173";
const DIR = "./screenshots";

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
const page = await context.newPage();

// 1. Login page — block auto-login API call so the form stays visible
await page.route("**/api/auth/login", async (route) => {
  // Only block the first (auto-login) request
  await route.abort();
});
await page.goto(BASE);
await page.evaluate(() => localStorage.clear());
await page.reload();
await page.waitForSelector('text=Log in');
await page.screenshot({ path: `${DIR}/01-login.png` });
console.log("1/8 Login page");

// Unblock the login route for manual login
await page.unrouteAll();

// 2. Login as student
await page.fill('input[type="email"]', "student@ntnu.no");
await page.fill('input[type="password"]', "password123");
await page.click('button[type="submit"]');
await page.waitForSelector('text=Log Usage');
await page.screenshot({ path: `${DIR}/02-dashboard.png` });
console.log("2/8 Dashboard after login");

// 3. Log AI Usage — fill form and submit
await page.click('text=Log Usage');
await page.waitForSelector('text=Record which AI tool');
await page.click('button:has-text("ChatGPT")');
await page.click('text=Grammar');
await page.click('text=Drafting');
await page.click('button:has-text("Essay on AI Ethics")');
await page.click('button:has-text("Submit")');
await page.waitForSelector('text=Log entry created');
await page.screenshot({ path: `${DIR}/03-log-usage.png` });
console.log("3/8 Log usage submitted");

// Create more logs for variety
await page.click('button:has-text("Copilot")');
await page.click('text=Coding');
await page.click('button:has-text("Programming Assignment 1")');
await page.click('button:has-text("Submit")');
await page.waitForSelector('text=Log entry created');

// 4. View Usage History
await page.click('text=History');
await page.waitForSelector('text=Usage History');
await page.waitForTimeout(500);
await page.screenshot({ path: `${DIR}/04-usage-history.png` });
console.log("4/8 Usage history");

// 5. Submit Declaration
await page.click('text=Declaration');
await page.waitForSelector('text=Submit Declaration');
await page.click('button:has-text("Essay on AI Ethics")');
await page.click('text=ChatGPT');
await page.click('button:has-text("Submit Declaration")');
await page.waitForSelector('text=Declaration submitted');
await page.screenshot({ path: `${DIR}/05-declaration.png` });
console.log("5/8 Declaration submitted");

// Create a high-risk scenario: log direct_answers, declare different tool
await page.click('text=Log Usage');
await page.waitForSelector('text=Record which AI tool');
await page.click('button:has-text("Claude")');
await page.click('text=Direct Answers');
await page.click('button:has-text("Final Project Report")');
await page.click('button:has-text("Submit")');
await page.waitForSelector('text=Log entry created');

await page.click('text=Declaration');
await page.waitForSelector('text=Submit Declaration');
await page.click('button:has-text("Final Project Report")');
await page.click('text=Copilot');
await page.click('button:has-text("Submit Declaration")');
await page.waitForSelector('text=Declaration submitted');

// 6. Login as admin
await page.click('text=Log out');
await page.waitForSelector('text=Log in');
await page.fill('input[type="email"]', "admin@ntnu.no");
await page.fill('input[type="password"]', "password123");
await page.click('button[type="submit"]');
await page.waitForSelector('text=Log Usage');
await page.waitForTimeout(300);

// 7. Classifications page
await page.click('text=Classifications');
await page.waitForTimeout(500);
await page.screenshot({ path: `${DIR}/06-classifications.png` });
console.log("6/8 Classifications (admin)");

// 8. Alerts page
await page.click('text=Alerts');
await page.waitForTimeout(500);
await page.screenshot({ path: `${DIR}/07-alerts.png` });
console.log("7/8 Alerts (admin)");

await browser.close();

// 9. Test output
const proc = Bun.spawn(["bun", "test"], { stdout: "pipe", stderr: "pipe" });
const stdout = await new Response(proc.stdout).text();
const stderr = await new Response(proc.stderr).text();
await Bun.write(`${DIR}/08-tests-output.txt`, stdout + stderr);
console.log("8/8 Test output saved");

console.log("\nAll screenshots saved to ./screenshots/");
process.exit(0);
