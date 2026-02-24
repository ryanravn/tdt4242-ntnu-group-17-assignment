#!/usr/bin/env bun

/**
 * Watches the OpenAPI schema endpoint and regenerates types when it changes.
 */
import { spawn } from "bun";

const API_URL = process.env.API_URL || "http://localhost:3000";
const OPENAPI_ENDPOINT = `${API_URL}/openapi`;
const POLL_INTERVAL = 2000;

let lastHash: string | null = null;
let isGenerating = false;

async function getSchemaHash(): Promise<string | null> {
  try {
    const res = await fetch(OPENAPI_ENDPOINT);
    if (!res.ok) return null;
    const text = await res.text();
    const hasher = new Bun.CryptoHasher("sha256");
    hasher.update(text);
    return hasher.digest("hex");
  } catch {
    return null;
  }
}

async function regenerateTypes() {
  if (isGenerating) return;
  isGenerating = true;

  console.log("[types] Schema changed, regenerating...");
  const proc = spawn(
    [
      "bunx",
      "openapi-typescript",
      OPENAPI_ENDPOINT,
      "-o",
      "client/lib/api-types.d.ts",
    ],
    { stdout: "inherit", stderr: "inherit" },
  );
  await proc.exited;
  console.log("[types] Done\n");

  isGenerating = false;
}

async function poll() {
  const hash = await getSchemaHash();
  if (hash === null) return;

  if (lastHash === null) {
    lastHash = hash;
    console.log("[types] Watching OpenAPI schema for changes...");
    return;
  }

  if (hash !== lastHash) {
    lastHash = hash;
    await regenerateTypes();
  }
}

setInterval(poll, POLL_INTERVAL);
setTimeout(poll, 1000);

await new Promise(() => {});
