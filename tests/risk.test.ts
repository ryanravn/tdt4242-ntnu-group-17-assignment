import { describe, it, expect, beforeAll } from "bun:test";
import app from "../server/index";
import { db } from "../server/db/client";
import { logs, declarations, classifications, alerts } from "../server/db/schema";

type Classification = { id: number; studentId: number; assignmentId: number; riskLevel: string; undeclaredTools: string[] | null; declaredNotLogged: string[] | null; createdAt: string };
type Alert = { id: number; classificationId: number; studentId: number; assignmentId: number; riskLevel: string; createdAt: string };

// Helper: login and return the token
async function login(email = "student@ntnu.no", password = "password123") {
  const res = await app.request("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const body = await res.json();
  return body.token as string;
}

// Helper: create a log entry
async function createLog(
  token: string,
  data: { tool: string; taskTypes: string[]; assignmentId: number },
) {
  return app.request("/api/logs", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
}

// Helper: create a declaration
async function createDeclaration(
  token: string,
  data: { assignmentId: number; declaredTools: string[] },
) {
  return app.request("/api/declarations", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
}

// Clean all test data before the entire file runs
beforeAll(async () => {
  await db.delete(alerts);
  await db.delete(classifications);
  await db.delete(declarations);
  await db.delete(logs);
});

describe("RE-13: Risk Classification", () => {
  it("classifies low risk for minor tasks with low frequency", async () => {
    const token = await login();

    await createLog(token, {
      tool: "chatgpt",
      taskTypes: ["grammar"],
      assignmentId: 1,
    });

    await createDeclaration(token, {
      assignmentId: 1,
      declaredTools: ["chatgpt"],
    });

    const adminToken = await login("admin@ntnu.no", "password123");
    const res = await app.request("/api/classifications", {
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    expect(res.status).toBe(200);
    const all = (await res.json()) as Classification[];
    const match = all.find((c) => c.assignmentId === 1);
    expect(match).toBeDefined();
    expect(match.riskLevel).toBe("low");
  });

  it("classifies medium risk for frequent substantial tasks", async () => {
    const token = await login();

    await createLog(token, { tool: "chatgpt", taskTypes: ["drafting", "coding"], assignmentId: 2 });
    await createLog(token, { tool: "chatgpt", taskTypes: ["drafting"], assignmentId: 2 });
    await createLog(token, { tool: "copilot", taskTypes: ["coding"], assignmentId: 2 });

    await createDeclaration(token, {
      assignmentId: 2,
      declaredTools: ["chatgpt", "copilot"],
    });

    const adminToken = await login("admin@ntnu.no", "password123");
    const res = await app.request("/api/classifications", {
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    expect(res.status).toBe(200);
    const all = (await res.json()) as Classification[];
    const match = all.find((c) => c.assignmentId === 2);
    expect(match).toBeDefined();
    expect(match.riskLevel).toBe("medium");
  });

  it("classifies high risk for direct answer usage", async () => {
    const token = await login();

    await createLog(token, {
      tool: "chatgpt",
      taskTypes: ["direct_answers"],
      assignmentId: 3,
    });

    await createDeclaration(token, {
      assignmentId: 3,
      declaredTools: ["chatgpt"],
    });

    const adminToken = await login("admin@ntnu.no", "password123");
    const res = await app.request("/api/classifications", {
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    expect(res.status).toBe(200);
    const all = (await res.json()) as Classification[];
    const match = all.find((c) => c.assignmentId === 3);
    expect(match).toBeDefined();
    expect(match.riskLevel).toBe("high");
  });
});

describe("RE-14: Declaration vs Log Comparison", () => {
  // Clean slate before RE-14 tests — RE-13 already used assignments 1-3
  beforeAll(async () => {
    await db.delete(alerts);
    await db.delete(classifications);
    await db.delete(declarations);
    await db.delete(logs);
  });

  it("detects undeclared tools", async () => {
    const token = await login();

    // Log chatgpt but only declare copilot
    await createLog(token, { tool: "chatgpt", taskTypes: ["grammar"], assignmentId: 1 });
    await createDeclaration(token, { assignmentId: 1, declaredTools: ["copilot"] });

    const adminToken = await login("admin@ntnu.no", "password123");
    const res = await app.request("/api/classifications", {
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    expect(res.status).toBe(200);
    const all = (await res.json()) as Classification[];
    const match = all.find((c) => c.assignmentId === 1);
    expect(match).toBeDefined();
    expect(match.undeclaredTools).toContain("chatgpt");
  });

  it("detects declared but not logged tools", async () => {
    const token = await login();

    // Log chatgpt but declare chatgpt + copilot
    await createLog(token, { tool: "chatgpt", taskTypes: ["grammar"], assignmentId: 2 });
    await createDeclaration(token, { assignmentId: 2, declaredTools: ["chatgpt", "copilot"] });

    const adminToken = await login("admin@ntnu.no", "password123");
    const res = await app.request("/api/classifications", {
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    expect(res.status).toBe(200);
    const all = (await res.json()) as Classification[];
    const match = all.find((c) => c.assignmentId === 2);
    expect(match).toBeDefined();
    expect(match.declaredNotLogged).toContain("copilot");
  });

  it("no discrepancies when declaration matches logs", async () => {
    const token = await login();

    await createLog(token, { tool: "chatgpt", taskTypes: ["grammar"], assignmentId: 3 });
    await createDeclaration(token, { assignmentId: 3, declaredTools: ["chatgpt"] });

    const adminToken = await login("admin@ntnu.no", "password123");
    const res = await app.request("/api/classifications", {
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    expect(res.status).toBe(200);
    const all = (await res.json()) as Classification[];
    const match = all.find((c) => c.assignmentId === 3);
    expect(match).toBeDefined();

    const undeclared = match.undeclaredTools ?? [];
    const notLogged = match.declaredNotLogged ?? [];
    expect(undeclared).toHaveLength(0);
    expect(notLogged).toHaveLength(0);
  });
});

describe("RE-15: Auto-Classify on Declaration Submit", () => {
  it("GET /api/classifications returns all classifications", async () => {
    const adminToken = await login("admin@ntnu.no", "password123");
    const res = await app.request("/api/classifications", {
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
  });
});

describe("RE-16: Alerts for High Risk", () => {
  beforeAll(async () => {
    await db.delete(alerts);
    await db.delete(classifications);
    await db.delete(declarations);
    await db.delete(logs);
  });

  it("creates an alert when classification is high risk", async () => {
    const token = await login();

    await createLog(token, { tool: "chatgpt", taskTypes: ["direct_answers"], assignmentId: 1 });
    await createDeclaration(token, { assignmentId: 1, declaredTools: ["chatgpt"] });

    const adminToken = await login("admin@ntnu.no", "password123");
    const res = await app.request("/api/alerts", {
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    expect(res.status).toBe(200);
    const all = (await res.json()) as Alert[];
    const match = all.find((a) => a.assignmentId === 1 && a.riskLevel === "high");
    expect(match).toBeDefined();
    expect(match.studentId).toBeDefined();
  });

  it("does not create alert for low/medium risk", async () => {
    const token = await login();

    await createLog(token, { tool: "chatgpt", taskTypes: ["grammar"], assignmentId: 2 });
    await createDeclaration(token, { assignmentId: 2, declaredTools: ["chatgpt"] });

    const adminToken = await login("admin@ntnu.no", "password123");
    const res = await app.request("/api/alerts", {
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    expect(res.status).toBe(200);
    const all = (await res.json()) as Alert[];
    const match = all.find((a) => a.assignmentId === 2);
    expect(match).toBeUndefined();
  });

  it("GET /api/alerts returns all alerts", async () => {
    const adminToken = await login("admin@ntnu.no", "password123");
    const res = await app.request("/api/alerts", {
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
  });
});
