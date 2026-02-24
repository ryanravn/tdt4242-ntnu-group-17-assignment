import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { db } from "../db/client";
import { alerts } from "../db/schema";
import { requireAuth } from "../lib/auth";

// ── Schemas ───────────────────────────────────────────────────────────────────

const alertResponseSchema = z.object({
  id: z.number(),
  classificationId: z.number(),
  studentId: z.number(),
  assignmentId: z.number(),
  riskLevel: z.string(),
  createdAt: z.string(),
});

const alertsListResponseSchema = z.array(alertResponseSchema);

// ── App ───────────────────────────────────────────────────────────────────────

const app = new OpenAPIHono();

// GET /api/alerts — RE-16: View all alerts
app.openapi(
  createRoute({
    method: "get",
    path: "/",
    responses: {
      200: {
        description: "List of alerts",
        content: { "application/json": { schema: alertsListResponseSchema } },
      },
      401: { description: "Unauthorized" },
    },
  }),
  async (c) => {
    await requireAuth(c);

    const entries = await db.select().from(alerts);

    return c.json(
      entries.map((e) => ({
        id: e.id,
        classificationId: e.classificationId,
        studentId: e.studentId,
        assignmentId: e.assignmentId,
        riskLevel: e.riskLevel,
        createdAt: e.createdAt.toISOString(),
      })),
      200,
    );
  },
);

export default app;
