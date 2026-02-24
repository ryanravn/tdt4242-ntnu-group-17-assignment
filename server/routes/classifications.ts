import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { db } from "../db/client";
import { classifications } from "../db/schema";
import { requireAuth } from "../lib/auth";

// ── Schemas ───────────────────────────────────────────────────────────────────

const classificationResponseSchema = z.object({
  id: z.number(),
  studentId: z.number(),
  assignmentId: z.number(),
  riskLevel: z.string(),
  undeclaredTools: z.array(z.string()).nullable(),
  declaredNotLogged: z.array(z.string()).nullable(),
  createdAt: z.string(),
});

const classificationsListResponseSchema = z.array(classificationResponseSchema);

// ── App ───────────────────────────────────────────────────────────────────────

const app = new OpenAPIHono();

// GET /api/classifications — RE-15: View all classifications
app.openapi(
  createRoute({
    method: "get",
    path: "/",
    responses: {
      200: {
        description: "List of classifications",
        content: { "application/json": { schema: classificationsListResponseSchema } },
      },
      401: { description: "Unauthorized" },
    },
  }),
  async (c) => {
    await requireAuth(c);

    const entries = await db.select().from(classifications);

    return c.json(
      entries.map((e) => ({
        id: e.id,
        studentId: e.studentId,
        assignmentId: e.assignmentId,
        riskLevel: e.riskLevel,
        undeclaredTools: e.undeclaredTools,
        declaredNotLogged: e.declaredNotLogged,
        createdAt: e.createdAt.toISOString(),
      })),
      200,
    );
  },
);

export default app;
