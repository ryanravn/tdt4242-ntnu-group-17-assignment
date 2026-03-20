/**
 * TC-NFR-01 — POST /api/logs responds within 2000 ms (after warm-up).
 * TC-NFR-02 — Sample API chain: each step within 30000 ms.
 */
import app from "../../server/index";

const NFR01_MS = 2000;
const NFR02_MS = 30_000;

async function login(email: string, password: string): Promise<string> {
  const res = await app.request("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error(`Login ${email} failed: ${res.status}`);
  return ((await res.json()) as { token: string }).token;
}

async function timed<T>(name: string, fn: () => Promise<T>): Promise<{ name: string; ms: number; result: T }> {
  const t0 = performance.now();
  const result = await fn();
  const ms = performance.now() - t0;
  return { name, ms, result };
}

async function main() {
  let exit = 0;

  const studentToken = await login("student@ntnu.no", "password123");

  // Warm-up (cold DB / first query can exceed NFR-01 unfairly)
  await app.request("/api/logs", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${studentToken}`,
    },
    body: JSON.stringify({
      tool: "chatgpt",
      taskTypes: ["grammar"],
      assignmentId: 1,
    }),
  });

  const postLog = await timed("POST /api/logs (NFR-01)", async () => {
    const res = await app.request("/api/logs", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${studentToken}`,
      },
      body: JSON.stringify({
        tool: "claude",
        taskTypes: ["summarizing"],
        assignmentId: 1,
      }),
    });
    return res.status;
  });

  const nfr01Pass = postLog.result === 201 && postLog.ms <= NFR01_MS;
  console.log(
    `${nfr01Pass ? "PASS" : "FAIL"} TC-NFR-01: ${postLog.ms.toFixed(1)}ms (limit ${NFR01_MS}ms), status ${postLog.result}`,
  );
  if (!nfr01Pass) exit = 1;

  // TC-NFR-02 — sequential representative calls
  const chain: { name: string; ms: number; ok: boolean }[] = [];

  const tLogin = await timed("POST login (student)", () =>
    login("student@ntnu.no", "password123").then(() => undefined),
  );
  chain.push({
    name: tLogin.name,
    ms: tLogin.ms,
    ok: tLogin.ms <= NFR02_MS,
  });

  const stu = await login("student@ntnu.no", "password123");
  const tGetLogs = await timed("GET /api/logs", async () => {
    const res = await app.request("/api/logs", {
      headers: { Authorization: `Bearer ${stu}` },
    });
    return res.status;
  });
  chain.push({
    name: tGetLogs.name,
    ms: tGetLogs.ms,
    ok: tGetLogs.ms <= NFR02_MS && tGetLogs.result === 200,
  });

  const tHealth = await timed("GET /health", async () => {
    const res = await app.request("/health");
    return res.status;
  });
  chain.push({
    name: tHealth.name,
    ms: tHealth.ms,
    ok: tHealth.ms <= NFR02_MS && tHealth.result === 200,
  });

  const admin = await login("admin@ntnu.no", "password123");
  const tClass = await timed("GET /api/classifications (admin)", async () => {
    const res = await app.request("/api/classifications", {
      headers: { Authorization: `Bearer ${admin}` },
    });
    return res.status;
  });
  chain.push({
    name: tClass.name,
    ms: tClass.ms,
    ok: tClass.ms <= NFR02_MS && tClass.result === 200,
  });

  const nfr02Pass = chain.every((s) => s.ok);
  console.log(
    `${nfr02Pass ? "PASS" : "FAIL"} TC-NFR-02: each step ≤ ${NFR02_MS}ms`,
  );
  for (const s of chain) {
    console.log(`  ${s.ok ? "  " : "!!"} ${s.name}: ${s.ms.toFixed(1)}ms`);
  }
  if (!nfr02Pass) exit = 1;

  process.exit(exit);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
