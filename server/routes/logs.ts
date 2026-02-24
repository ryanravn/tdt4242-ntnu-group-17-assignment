import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { HTTPException } from "hono/http-exception";
import { eq, and, gte, lte, desc } from "drizzle-orm";
import { db } from "../db/client";
import { logs, assignments } from "../db/schema";
import { requireAuth } from "../lib/auth";

// ── Schemas ───────────────────────────────────────────────────────────────────

const createLogSchema = z.object({
  tool: z.enum(["chatgpt", "copilot", "claude", "other"]),
  taskTypes: z.array(z.string()).min(1),
  assignmentId: z.number(),
});

const logResponseSchema = z.object({
  id: z.number(),
  tool: z.string(),
  taskTypes: z.array(z.string()),
  assignmentId: z.number(),
  createdAt: z.string(),
});

const logsListResponseSchema = z.array(logResponseSchema);

const logsQuerySchema = z.object({
  assignment_id: z.coerce.number().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
});

// ── App ───────────────────────────────────────────────────────────────────────

const app = new OpenAPIHono();

// POST /api/logs — RE-09: Log AI Usage + RE-10: Assignment validation
app.openapi(
  createRoute({
    method: "post",
    path: "/",
    request: {
      body: { content: { "application/json": { schema: createLogSchema } } },
    },
    responses: {
      201: {
        description: "Log entry created",
        content: { "application/json": { schema: logResponseSchema } },
      },
      400: { description: "Validation error" },
      401: { description: "Unauthorized" },
      404: { description: "Assignment not found" },
    },
  }),
  async (c) => {
    const payload = await requireAuth(c);
    const { tool, taskTypes, assignmentId } = c.req.valid("json");
    const userId = Number(payload.sub);

    // RE-10: Verify the assignment exists
    const [assignment] = await db
      .select()
      .from(assignments)
      .where(eq(assignments.id, assignmentId))
      .limit(1);

    if (!assignment) {
      throw new HTTPException(404, { message: "Assignment not found" });
    }

    // Insert the log entry
    const [entry] = await db
      .insert(logs)
      .values({
        studentId: userId,
        assignmentId,
        tool,
        taskTypes,
      })
      .returning();

    return c.json(
      {
        id: entry.id,
        tool: entry.tool,
        taskTypes: entry.taskTypes,
        assignmentId: entry.assignmentId,
        createdAt: entry.createdAt.toISOString(),
      },
      201,
    );
  },
);

// GET /api/logs — RE-12: View Usage History
app.openapi(
  createRoute({
    method: "get",
    path: "/",
    request: {
      query: logsQuerySchema,
    },
    responses: {
      200: {
        description: "List of log entries",
        content: { "application/json": { schema: logsListResponseSchema } },
      },
      401: { description: "Unauthorized" },
    },
  }),
  async (c) => {
    const payload = await requireAuth(c);
    const userId = Number(payload.sub);
    const { assignment_id, from, to } = c.req.valid("query");

    // Build conditions
    const conditions = [eq(logs.studentId, userId)];

    if (assignment_id !== undefined) {
      conditions.push(eq(logs.assignmentId, assignment_id));
    }
    if (from) {
      conditions.push(gte(logs.createdAt, new Date(from)));
    }
    if (to) {
      conditions.push(lte(logs.createdAt, new Date(to)));
    }

    const entries = await db
      .select()
      .from(logs)
      .where(and(...conditions))
      .orderBy(desc(logs.createdAt));

    return c.json(
      entries.map((e) => ({
        id: e.id,
        tool: e.tool,
        taskTypes: e.taskTypes,
        assignmentId: e.assignmentId,
        createdAt: e.createdAt.toISOString(),
      })),
      200,
    );
  },
);

export default app;
