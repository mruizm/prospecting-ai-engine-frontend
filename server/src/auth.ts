import cookieSession from "cookie-session";
import type { NextFunction, Request, Response, Router } from "express";
import { Router as createRouter } from "express";
import { env } from "./env.js";

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Placeholder auth: one shared password gates the whole console behind a
 * signed session cookie. This exists so the tool isn't wide open while the
 * team decides on real SSO — see docs/PLAN.md §7. Swap this file's contents
 * for an SSO integration when that lands; nothing else in the app depends
 * on how a session gets established, only on `requireSession`.
 */
export const sessionMiddleware = cookieSession({
  name: "console_session",
  secret: env.sessionSecret,
  maxAge: ONE_DAY_MS,
  httpOnly: true,
  sameSite: "lax",
  secure: env.nodeEnv === "production",
});

export function requireSession(req: Request, res: Response, next: NextFunction): void {
  if (req.session?.authenticated) {
    next();
    return;
  }
  res.status(401).json({ detail: "Not authenticated" });
}

export const authRouter: Router = createRouter();

authRouter.post("/login", (req: Request, res: Response) => {
  const password = typeof req.body?.password === "string" ? req.body.password : "";
  if (password.length === 0 || password !== env.sessionPassword) {
    res.status(401).json({ detail: "Incorrect password" });
    return;
  }
  if (req.session) {
    req.session.authenticated = true;
  }
  res.status(204).end();
});

authRouter.post("/logout", (req: Request, res: Response) => {
  req.session = null;
  res.status(204).end();
});

authRouter.get("/session", (req: Request, res: Response) => {
  res.json({ authenticated: Boolean(req.session?.authenticated) });
});
