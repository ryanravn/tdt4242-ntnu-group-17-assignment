import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { HTTPException } from "hono/http-exception";
import { eq } from "drizzle-orm";
import { db } from "../db/client";
import { users } from "../db/schema";
import { createToken, requireAuth } from "../lib/auth";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const loginResponseSchema = z.object({
  token: z.string(),
  user: z.object({
    id: z.number(),
    email: z.string(),
    name: z.string(),
    role: z.enum(["student", "admin"]),
  }),
});

const app = new OpenAPIHono();

app.openapi(
  createRoute({
    method: "post",
    path: "/login",
    request: {
      body: { content: { "application/json": { schema: loginSchema } } },
    },
    responses: {
      200: {
        description: "Login successful",
        content: { "application/json": { schema: loginResponseSchema } },
      },
      400: { description: "Validation error" },
      401: { description: "Invalid credentials" },
    },
  }),
  async (c) => {
    const { email, password } = c.req.valid("json");

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!user) {
      throw new HTTPException(401, { message: "Invalid credentials" });
    }

    const valid = await Bun.password.verify(password, user.password);
    if (!valid) {
      throw new HTTPException(401, { message: "Invalid credentials" });
    }

    const token = await createToken(user.id, user.role);

    return c.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    }, 200);
  },
);

const userResponseSchema = z.object({
  id: z.number(),
  email: z.string(),
  name: z.string(),
  role: z.enum(["student", "admin"]),
});

app.openapi(
  createRoute({
    method: "get",
    path: "/me",
    security: [{ Bearer: [] }],
    responses: {
      200: {
        description: "Current user",
        content: { "application/json": { schema: userResponseSchema } },
      },
      401: { description: "Unauthorized" },
    },
  }),
  async (c) => {
    const payload = await requireAuth(c);

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, Number(payload.sub)))
      .limit(1);

    if (!user) {
      throw new HTTPException(401, { message: "User not found" });
    }

    return c.json({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    }, 200);
  },
);

export default app;
