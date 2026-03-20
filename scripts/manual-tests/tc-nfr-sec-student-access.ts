/**
 * TC-NFR-SEC-01 — Student JWT on admin-oriented list endpoints.
 *
 * Documents current behaviour: implementation may return 200 (known gap) or 403 after hardening.
 * Exit 0 = script ran and printed results; use output for your test report Pass/Fail vs policy.
 */
import app from "../../server/index";

async function loginStudent(): Promise<string> {
  const res = await app.request("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "student@ntnu.no",
      password: "password123",
    }),
  });
  if (!res.ok) throw new Error(`Student login failed: ${res.status}`);
  return ((await res.json()) as { token: string }).token;
}

async function main() {
  const token = await loginStudent();

  const classRes = await app.request("/api/classifications", {
    headers: { Authorization: `Bearer ${token}` },
  });
  const classBody = await classRes.json();

  const alertsRes = await app.request("/api/alerts", {
    headers: { Authorization: `Bearer ${token}` },
  });
  const alertsBody = await alertsRes.json();

  console.log("TC-NFR-SEC-01 — Student token accessing admin data:");
  console.log(
    `  GET /api/classifications → ${classRes.status} (array length: ${Array.isArray(classBody) ? classBody.length : "n/a"})`,
  );
  console.log(
    `  GET /api/alerts → ${alertsRes.status} (array length: ${Array.isArray(alertsBody) ? alertsBody.length : "n/a"})`,
  );
  console.log(
    "  Policy note: ideal is 403 Forbidden for non-admin; current codebase may allow 200 (see tasks/2.3-code-review.md).",
  );
  console.log(
    "  Script exit 0 = completed; decide Pass/Fail in your test plan based on intended security policy.",
  );
  // Importing the app opens a Postgres pool; exit explicitly or the process hangs.
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
