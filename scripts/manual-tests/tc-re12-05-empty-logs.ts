/**
 * TC-RE12-05 — GET /api/logs returns [] when the student has no log rows.
 *
 * Clears ALL log entries for the seeded student (student@ntnu.no), then checks GET /api/logs.
 * WARNING: Destructive to demo log data for that user. Re-seed if needed: bun run db:seed
 */
import { eq } from "drizzle-orm";
import app from "../../server/index";
import { db } from "../../server/db/client";
import { logs, users } from "../../server/db/schema";

async function loginStudent(): Promise<string> {
  const res = await app.request("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "student@ntnu.no",
      password: "password123",
    }),
  });
  if (!res.ok) {
    throw new Error(`Login failed: ${res.status}`);
  }
  const body = (await res.json()) as { token: string };
  return body.token;
}

async function main() {
  const [student] = await db
    .select()
    .from(users)
    .where(eq(users.email, "student@ntnu.no"))
    .limit(1);

  if (!student) {
    console.error("FAIL TC-RE12-05: seed student student@ntnu.no not found (run bun run db:seed)");
    process.exit(1);
  }

  const deleted = await db.delete(logs).where(eq(logs.studentId, student.id)).returning({ id: logs.id });
  console.log(`TC-RE12-05: deleted ${deleted.length} log row(s) for student id=${student.id}`);

  const token = await loginStudent();
  const res = await app.request("/api/logs", {
    headers: { Authorization: `Bearer ${token}` },
  });

  const body = (await res.json()) as unknown;
  const pass =
    res.status === 200 && Array.isArray(body) && body.length === 0;

  if (pass) {
    console.log("PASS TC-RE12-05: GET /api/logs → 200, []");
    process.exit(0);
  }

  console.error("FAIL TC-RE12-05", {
    status: res.status,
    bodyType: Array.isArray(body) ? "array" : typeof body,
    length: Array.isArray(body) ? body.length : null,
  });
  process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
