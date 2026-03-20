/**
 * Runs API-side manual test scripts in sequence (excludes Playwright TC-SYS-*).
 */
import { spawnSync } from "node:child_process";

const scripts = [
  "scripts/manual-tests/tc-re12-05-empty-logs.ts",
  "scripts/manual-tests/tc-nfr-performance.ts",
  "scripts/manual-tests/tc-nfr-sec-student-access.ts",
];

let code = 0;
for (const s of scripts) {
  console.log(`\n--- bun ${s} ---\n`);
  const r = spawnSync("bun", ["run", s], { stdio: "inherit", shell: false });
  if (r.status !== 0) code = r.status ?? 1;
}

console.log(code === 0 ? "\nAll manual API scripts OK" : "\nSome manual API scripts failed");
process.exit(code);
