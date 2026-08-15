import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import { authRouter, requireSession, sessionMiddleware } from "./auth.js";
import { env } from "./env.js";
import { proxyToEngine } from "./proxy.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const appDist = path.resolve(__dirname, "../../app/dist");

const app = express();
app.disable("x-powered-by");
app.set("trust proxy", env.trustProxy);
app.use(express.json({ limit: "1mb" }));
app.use(sessionMiddleware);

app.get("/healthz", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/auth", authRouter);

// Everything the engine exposes, mirrored under /api/* with the internal
// API key attached server-side. See docs/PLAN.md §4.
app.all("/api/{*splat}", requireSession, (req, res) => {
  void proxyToEngine(req, res);
});

if (env.nodeEnv === "production") {
  app.use(express.static(appDist));
  app.use((req, res, next) => {
    if (req.method !== "GET") {
      next();
      return;
    }
    res.sendFile(path.join(appDist, "index.html"));
  });
}

app.listen(env.port, () => {
  console.log(`Prospecting Console BFF listening on :${env.port} (${env.nodeEnv})`);
  console.log(`Proxying /api/* -> ${env.engineUrl}`);
});
