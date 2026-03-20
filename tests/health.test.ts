/**
 * Test IDs: tasks/3.1-test-plan.md (Task 3.1) — TC-INFRA-01, TC-INFRA-02.
 */
import { describe, it, expect } from "bun:test";
import app from "../server/index";

describe("GET /health", () => {
  // TC-INFRA-01
  it("returns ok status", async () => {
    const res = await app.request("/health");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("ok");
  });
});

describe("GET /openapi", () => {
  // TC-INFRA-02
  it("returns the OpenAPI spec", async () => {
    const res = await app.request("/openapi");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.openapi).toBe("3.1.0");
    expect(body.info.title).toBe("AIGuidebook API");
  });
});
