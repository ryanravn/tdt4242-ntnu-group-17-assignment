/**
 * Generate TypeScript types from the OpenAPI spec.
 * Imports the Hono app directly — no running server needed.
 */
import { writeFileSync, mkdirSync } from "fs";
import { execSync } from "child_process";
import app from "../server/index";

const SPEC_FILE = "/tmp/aiguidebook-openapi.json";
const OUTPUT_FILE = "client/lib/api-types.d.ts";

// Get the OpenAPI spec from the app in-process
const res = await app.request("/openapi");
const spec = await res.json();
writeFileSync(SPEC_FILE, JSON.stringify(spec, null, 2));

// Generate types
mkdirSync("client/lib", { recursive: true });
execSync(`bunx openapi-typescript ${SPEC_FILE} -o ${OUTPUT_FILE}`, {
  stdio: "inherit",
});

console.log(`Types generated at ${OUTPUT_FILE}`);
