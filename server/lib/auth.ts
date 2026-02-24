import { sign, verify } from "hono/jwt";
import type { Context } from "hono";
import { HTTPException } from "hono/http-exception";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";

export async function createToken(userId: number, role: string) {
  return sign({ sub: userId, role, exp: Math.floor(Date.now() / 1000) + 86400 }, JWT_SECRET);
}

export async function requireAuth(c: Context) {
  const header = c.req.header("Authorization");
  if (!header?.startsWith("Bearer ")) {
    throw new HTTPException(401, { message: "Missing or invalid token" });
  }

  const token = header.slice(7);
  try {
    const payload = await verify(token, JWT_SECRET, "HS256");
    return payload as { sub: number; role: string };
  } catch {
    throw new HTTPException(401, { message: "Invalid token" });
  }
}
