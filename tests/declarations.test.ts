/**
 * Test IDs: tasks/3.1-test-plan.md (Task 3.1) — TC-RE11-*, TC-RE15-01.
 */
import { describe, it, expect, beforeAll } from "bun:test";
import app from "../server/index";
import { db } from "../server/db/client";
import { logs, declarations, classifications, alerts } from "../server/db/schema";

// Clean slate before declarations tests
beforeAll(async () => {
  await db.delete(alerts);
  await db.delete(classifications);
  await db.delete(declarations);
  await db.delete(logs);
});

type Classification = { assignmentId: number; riskLevel: string; studentId: number };

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

describe("POST /api/declarations", () => {
  // TC-RE11-01
  it("creates a declaration with valid data", async () => {
    const token = await login();
    const res = await app.request("/api/declarations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        assignmentId: 2,
        declaredTools: ["chatgpt", "copilot"],
      }),
    });

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.id).toBeDefined();
    expect(body.assignmentId).toBe(2);
    expect(body.declaredTools).toEqual(["chatgpt", "copilot"]);
    expect(body.createdAt).toBeDefined();
  });

  // TC-RE11-02
  it("returns 409 when declaration already exists for student+assignment", async () => {
    const token = await login();

    // First declaration for assignment 3
    const first = await app.request("/api/declarations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        assignmentId: 3,
        declaredTools: ["chatgpt"],
      }),
    });
    expect(first.status).toBe(201);

    // Second declaration for the same assignment — should conflict
    const second = await app.request("/api/declarations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        assignmentId: 3,
        declaredTools: ["copilot"],
      }),
    });
    expect(second.status).toBe(409);
  });

  // TC-RE11-03
  it("returns 400 for missing assignmentId", async () => {
    const token = await login();
    const res = await app.request("/api/declarations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        declaredTools: ["chatgpt"],
      }),
    });

    expect(res.status).toBe(400);
  });

  // TC-RE11-04
  it("returns 400 for missing declaredTools", async () => {
    const token = await login();
    const res = await app.request("/api/declarations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        assignmentId: 2,
      }),
    });

    expect(res.status).toBe(400);
  });

  // TC-RE11-05
  it("returns 401 without auth", async () => {
    const res = await app.request("/api/declarations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        assignmentId: 2,
        declaredTools: ["chatgpt"],
      }),
    });

    expect(res.status).toBe(401);
  });

  // TC-RE15-01 (auto-classify after POST /api/declarations; see also risk.test.ts)
  it("triggers risk classification on creation", async () => {
    const token = await login();

    // First, create some log entries for assignment 1
    await app.request("/api/logs", {
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

    // Submit a declaration for assignment 1
    const declRes = await app.request("/api/declarations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        assignmentId: 1,
        declaredTools: ["chatgpt"],
      }),
    });
    expect(declRes.status).toBe(201);

    // Check that a classification was created
    const classRes = await app.request("/api/classifications", {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(classRes.status).toBe(200);

    const classifications = await classRes.json();
    const match = (classifications as Classification[]).find(
      (c) => c.assignmentId === 1,
    );
    expect(match).toBeDefined();
    expect(match.riskLevel).toBeDefined();
    expect(match.studentId).toBeDefined();
    expect(match.assignmentId).toBe(1);
  });
});
