import type { Request, Response } from "express";
import { env } from "./env.js";

/**
 * Forwards everything under /api/* to the engine's matching /* path,
 * attaching the internal X-API-Key server-side. The browser only ever
 * talks to this BFF; it never sees the engine's origin or its key.
 */
const DROPPED_REQUEST_HEADERS = new Set(["host", "connection", "content-length", "cookie", "x-api-key"]);
const DROPPED_RESPONSE_HEADERS = new Set(["content-encoding", "transfer-encoding", "connection"]);

export async function proxyToEngine(req: Request, res: Response): Promise<void> {
  const enginePath = req.originalUrl.replace(/^\/api/, "") || "/";
  const targetUrl = new URL(enginePath, env.engineUrl);

  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers)) {
    if (value === undefined || DROPPED_REQUEST_HEADERS.has(key.toLowerCase())) continue;
    headers.set(key, Array.isArray(value) ? value.join(", ") : value);
  }
  headers.set("host", targetUrl.host);
  headers.set("X-API-Key", env.engineApiKey);

  const hasBody = req.method !== "GET" && req.method !== "HEAD";
  const body = hasBody ? JSON.stringify(req.body ?? {}) : undefined;
  if (hasBody) headers.set("content-type", "application/json");

  let upstream: globalThis.Response;
  try {
    upstream = await fetch(targetUrl, { method: req.method, headers, body, redirect: "manual" });
  } catch {
    res.status(502).json({ detail: "Could not reach the analysis engine" });
    return;
  }

  res.status(upstream.status);
  upstream.headers.forEach((value, key) => {
    if (DROPPED_RESPONSE_HEADERS.has(key.toLowerCase())) return;
    res.setHeader(key, value);
  });
  res.send(Buffer.from(await upstream.arrayBuffer()));
}
