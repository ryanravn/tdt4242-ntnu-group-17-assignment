import { describe, it, expect, beforeAll } from "bun:test";
import app from "../server/index";
import { db } from "../server/db/client";
import { logs, declarations, classifications, alerts } from "../server/db/schema";

// Clean slate before log-read tests
beforeAll(async () => {
  await db.delete(alerts);
  await db.delete(classifications);
  await db.delete(declarations);
  await db.delete(logs);
});

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

// Helper: create a log entry via POST
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

describe("GET /api/logs", () => {
  it("returns log entries for the authenticated student", async () => {
    const token = await login();

    // Create a log entry first
    const createRes = await createLog(token, {
      tool: "chatgpt",
      taskTypes: ["grammar"],
      assignmentId: 1,
    });
    expect(createRes.status).toBe(201);

    // Fetch logs
    const res = await app.request("/api/logs", {
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(res.status).toBe(200);
    const logs = await res.json();
    expect(Array.isArray(logs)).toBe(true);
    expect(logs.length).toBeGreaterThanOrEqual(1);
  });

  it("returns entries ordered by most recent first", async () => {
    const token = await login();

    // Create two log entries with different tools to distinguish them
    await createLog(token, {
      tool: "copilot",
      taskTypes: ["drafting"],
      assignmentId: 1,
    });

    await createLog(token, {
      tool: "claude",
      taskTypes: ["grammar"],
      assignmentId: 2,
    });

    // Fetch logs
    const res = await app.request("/api/logs", {
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(res.status).toBe(200);
    const logs = await res.json();
    expect(Array.isArray(logs)).toBe(true);
    expect(logs.length).toBeGreaterThanOrEqual(2);

    // The most recently created entry should come first
    const firstDate = new Date(logs[0].createdAt).getTime();
    const secondDate = new Date(logs[1].createdAt).getTime();
    expect(firstDate).toBeGreaterThanOrEqual(secondDate);
  });

  it("filters by assignment_id query parameter", async () => {
    const token = await login();

    // Create a log for assignment 1
    await createLog(token, {
      tool: "chatgpt",
      taskTypes: ["drafting"],
      assignmentId: 1,
    });

    // Create a log for assignment 2
    await createLog(token, {
      tool: "chatgpt",
      taskTypes: ["grammar"],
      assignmentId: 2,
    });

    // Fetch only logs for assignment 1
    const res = await app.request("/api/logs?assignment_id=1", {
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(res.status).toBe(200);
    const logs = await res.json();
    expect(Array.isArray(logs)).toBe(true);

    // Every returned entry must belong to assignment 1
    for (const log of logs) {
      expect(log.assignmentId).toBe(1);
    }
  });

  it("filters by date range (from and to)", async () => {
    const token = await login();

    // Create a log entry (will have today's timestamp)
    await createLog(token, {
      tool: "chatgpt",
      taskTypes: ["grammar"],
      assignmentId: 1,
    });

    // Wide range that includes today — should return entries
    const resWide = await app.request(
      "/api/logs?from=2020-01-01&to=2030-01-01",
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );

    expect(resWide.status).toBe(200);
    const logsWide = await resWide.json();
    expect(Array.isArray(logsWide)).toBe(true);
    expect(logsWide.length).toBeGreaterThanOrEqual(1);

    // Future range that excludes today — should return empty array
    const resFuture = await app.request(
      "/api/logs?from=2030-01-01&to=2030-12-31",
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );

    expect(resFuture.status).toBe(200);
    const logsFuture = await resFuture.json();
    expect(Array.isArray(logsFuture)).toBe(true);
    expect(logsFuture.length).toBe(0);
  });

  it("returns an array response (correct format)", async () => {
    const token = await login();

    const res = await app.request("/api/logs", {
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(res.status).toBe(200);
    const logs = await res.json();
    expect(Array.isArray(logs)).toBe(true);
  });

  it("returns 401 without auth", async () => {
    const res = await app.request("/api/logs");
    expect(res.status).toBe(401);
  });
});
