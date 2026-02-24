import { describe, it, expect } from "bun:test";
import app from "../server/index";

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

describe("POST /api/auth/login", () => {
  it("returns a token for valid credentials", async () => {
    const res = await app.request("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "student@ntnu.no",
        password: "password123",
      }),
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.token).toBeString();
    expect(body.user.email).toBe("student@ntnu.no");
    expect(body.user.role).toBe("student");
    expect(body.user).not.toHaveProperty("password");
  });

  it("returns 401 for wrong password", async () => {
    const res = await app.request("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "student@ntnu.no",
        password: "wrongpassword",
      }),
    });

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.message).toBe("Invalid credentials");
  });

  it("returns 401 for non-existent user", async () => {
    const res = await app.request("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "nobody@ntnu.no",
        password: "password123",
      }),
    });

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.message).toBe("Invalid credentials");
  });

  it("returns 400 for missing fields", async () => {
    const res = await app.request("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "student@ntnu.no" }),
    });

    expect(res.status).toBe(400);
  });
});

describe("GET /api/auth/me", () => {
  it("returns the current user when authenticated", async () => {
    const token = await login();
    const res = await app.request("/api/auth/me", {
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.email).toBe("student@ntnu.no");
    expect(body.role).toBe("student");
    expect(body).not.toHaveProperty("password");
  });

  it("returns 401 without a token", async () => {
    const res = await app.request("/api/auth/me");
    expect(res.status).toBe(401);
  });

  it("returns 401 with an invalid token", async () => {
    const res = await app.request("/api/auth/me", {
      headers: { Authorization: "Bearer garbage" },
    });
    expect(res.status).toBe(401);
  });
});
