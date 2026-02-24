import { describe, it, expect } from "bun:test";
import app from "../server/index";

type LogEntry = { id: number; tool: string; taskTypes: string[]; assignmentId: number; createdAt: string };

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

describe("POST /api/logs", () => {
  it("creates a log entry with valid data", async () => {
    const token = await login();
    const res = await app.request("/api/logs", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        tool: "chatgpt",
        taskTypes: ["grammar", "drafting"],
        assignmentId: 1,
      }),
    });

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(typeof body.id).toBe("number");
    expect(body.tool).toBe("chatgpt");
    expect(body.taskTypes).toEqual(["grammar", "drafting"]);
    expect(body.assignmentId).toBe(1);
    expect(body.createdAt).toBeString();
  });

  it("returns 400 for missing tool", async () => {
    const token = await login();
    const res = await app.request("/api/logs", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        taskTypes: ["grammar"],
        assignmentId: 1,
      }),
    });

    expect(res.status).toBe(400);
  });

  it("returns 400 for missing taskTypes", async () => {
    const token = await login();
    const res = await app.request("/api/logs", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        tool: "chatgpt",
        assignmentId: 1,
      }),
    });

    expect(res.status).toBe(400);
  });

  it("returns 400 for missing assignmentId", async () => {
    const token = await login();
    const res = await app.request("/api/logs", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        tool: "chatgpt",
        taskTypes: ["grammar"],
      }),
    });

    expect(res.status).toBe(400);
  });

  it("returns 401 without auth", async () => {
    const res = await app.request("/api/logs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tool: "chatgpt",
        taskTypes: ["grammar"],
        assignmentId: 1,
      }),
    });

    expect(res.status).toBe(401);
  });
});

describe("RE-10: Assignment validation", () => {
  it("returns 404 for non-existent assignment", async () => {
    const token = await login();
    const res = await app.request("/api/logs", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        tool: "chatgpt",
        taskTypes: ["grammar"],
        assignmentId: 99999,
      }),
    });

    expect(res.status).toBe(404);
  });

  it("stores the assignment ID in the log entry", async () => {
    const token = await login();

    // Create a log entry
    const createRes = await app.request("/api/logs", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        tool: "chatgpt",
        taskTypes: ["grammar"],
        assignmentId: 1,
      }),
    });

    expect(createRes.status).toBe(201);

    // Fetch all logs and verify the entry has the correct assignmentId
    const listRes = await app.request("/api/logs", {
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(listRes.status).toBe(200);
    const logs = await listRes.json();
    expect(Array.isArray(logs)).toBe(true);

    const entry = logs.find(
      (log: LogEntry) => log.tool === "chatgpt" && log.assignmentId === 1,
    );
    expect(entry).toBeDefined();
    expect(entry.assignmentId).toBe(1);
  });
});
