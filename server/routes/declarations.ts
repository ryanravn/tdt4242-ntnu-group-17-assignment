import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { HTTPException } from "hono/http-exception";
import { eq, and } from "drizzle-orm";
import { db } from "../db/client";
import { declarations, logs, classifications, alerts } from "../db/schema";
import { requireAuth } from "../lib/auth";

// ── Schemas ───────────────────────────────────────────────────────────────────

const createDeclarationSchema = z.object({
  assignmentId: z.number(),
  declaredTools: z.array(z.string()).min(1),
});

const declarationResponseSchema = z.object({
  id: z.number(),
  assignmentId: z.number(),
  declaredTools: z.array(z.string()),
  createdAt: z.string(),
});

// ── Risk Classification Logic (RE-13, RE-14, RE-15, RE-16) ──────────────────

async function classifyDeclaration(
  studentId: number,
  assignmentId: number,
  declaredTools: string[],
) {
  // RE-14: Get all logs for this student+assignment
  const logEntries = await db
    .select()
    .from(logs)
    .where(and(eq(logs.studentId, studentId), eq(logs.assignmentId, assignmentId)));

  // RE-14: Compare logged tools vs declared tools
  const loggedTools = [...new Set(logEntries.map((l) => l.tool))];
  const undeclaredTools = loggedTools.filter((t) => !declaredTools.includes(t));
  const declaredNotLogged = declaredTools.filter((t) => !loggedTools.includes(t));

  // RE-13: Determine risk level
  let riskLevel: "low" | "medium" | "high" = "low";

  // Check for high risk conditions
  const hasDirectAnswers = logEntries.some((l) =>
    l.taskTypes.includes("direct_answers"),
  );
  const hasUndeclaredTools = undeclaredTools.length > 0;

  if (hasDirectAnswers || hasUndeclaredTools) {
    riskLevel = "high";
  } else {
    // Check for medium risk conditions
    const hasSubstantialTasks = logEntries.some(
      (l) => l.taskTypes.includes("drafting") || l.taskTypes.includes("coding"),
    );
    const hasHighFrequency = logEntries.length >= 3;

    if (hasSubstantialTasks || hasHighFrequency) {
      riskLevel = "medium";
    }
  }

  // Insert classification record
  const [classification] = await db
    .insert(classifications)
    .values({
      studentId,
      assignmentId,
      riskLevel,
      undeclaredTools,
      declaredNotLogged,
    })
    .returning();

  // RE-16: If high risk, create an alert
  if (riskLevel === "high") {
    await db.insert(alerts).values({
      classificationId: classification.id,
      studentId,
      assignmentId,
      riskLevel: "high",
    });
  }

  return classification;
}

// ── App ───────────────────────────────────────────────────────────────────────

const app = new OpenAPIHono();

// POST /api/declarations — RE-11: Submit Declaration
app.openapi(
  createRoute({
    method: "post",
    path: "/",
    request: {
      body: { content: { "application/json": { schema: createDeclarationSchema } } },
    },
    responses: {
      201: {
        description: "Declaration created",
        content: { "application/json": { schema: declarationResponseSchema } },
      },
      400: { description: "Validation error" },
      401: { description: "Unauthorized" },
      409: { description: "Declaration already exists" },
    },
  }),
  async (c) => {
    const payload = await requireAuth(c);
    const { assignmentId, declaredTools } = c.req.valid("json");
    const userId = Number(payload.sub);

    // Check if a declaration already exists for this student+assignment
    const [existing] = await db
      .select()
      .from(declarations)
      .where(
        and(
          eq(declarations.studentId, userId),
          eq(declarations.assignmentId, assignmentId),
        ),
      )
      .limit(1);

    if (existing) {
      throw new HTTPException(409, {
        message: "Declaration already exists for this assignment",
      });
    }

    // Insert the declaration
    const [declaration] = await db
      .insert(declarations)
      .values({
        studentId: userId,
        assignmentId,
        declaredTools,
      })
      .returning();

    // RE-15: Trigger risk classification after declaration
    await classifyDeclaration(userId, assignmentId, declaredTools);

    return c.json(
      {
        id: declaration.id,
        assignmentId: declaration.assignmentId,
        declaredTools: declaration.declaredTools,
        createdAt: declaration.createdAt.toISOString(),
      },
      201,
    );
  },
);

// GET /api/declarations — list current student's declarations
app.openapi(
  createRoute({
    method: "get",
    path: "/",
    responses: {
      200: {
        description: "List of declarations",
        content: { "application/json": { schema: z.array(declarationResponseSchema) } },
      },
      401: { description: "Unauthorized" },
    },
  }),
  async (c) => {
    const payload = await requireAuth(c);
    const userId = Number(payload.sub);

    const entries = await db
      .select()
      .from(declarations)
      .where(eq(declarations.studentId, userId));

    return c.json(
      entries.map((e) => ({
        id: e.id,
        assignmentId: e.assignmentId,
        declaredTools: e.declaredTools,
        createdAt: e.createdAt.toISOString(),
      })),
      200,
    );
  },
);

export default app;
