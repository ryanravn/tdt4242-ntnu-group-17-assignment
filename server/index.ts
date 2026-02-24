import { OpenAPIHono } from "@hono/zod-openapi";
import { apiReference } from "@scalar/hono-api-reference";
import { HTTPException } from "hono/http-exception";
import { cors } from "hono/cors";
import { serveStatic } from "hono/bun";

const app = new OpenAPIHono();

// CORS for dev
app.use(
  "*",
  cors({
    origin: ["http://localhost:5173", "http://localhost:3000"],
    credentials: true,
  }),
);

// Return errors as JSON
app.onError(async (err, c) => {
  if (err instanceof HTTPException) {
    return c.json({ message: err.message }, err.status);
  }
  console.error(err);
  return c.json({ message: "Internal server error" }, 500);
});

// TODO: mount routes here
// app.route("/api", logRoutes);

// OpenAPI spec + docs
app.doc("/openapi", {
  openapi: "3.1.0",
  info: { title: "AIGuidebook API", version: "1.0.0" },
});

app.get("/docs", apiReference({ spec: { url: "/openapi" }, theme: "kepler" }));

// Health check
app.get("/health", (c) => c.json({ status: "ok" }));

if (process.env.NODE_ENV === "production") {
  // Production: serve built frontend
  app.use("*", serveStatic({ root: "./dist/client" }));
  app.get("*", serveStatic({ root: "./dist/client", path: "index.html" }));
} else {
  // Dev: redirect to Vite dev server for HMR
  app.get("/", (c) => c.redirect("http://localhost:5173"));
}

export default app;
