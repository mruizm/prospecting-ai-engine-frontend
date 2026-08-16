import path from "node:path";
import { fileURLToPath } from "node:url";
import { config } from "dotenv";

const moduleDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryEnvPath = path.resolve(moduleDirectory, "../../.env");

// npm runs workspace scripts with server/ as the working directory. Resolve
// the documented repository-root .env from this module so development and
// compiled production builds load the same file. Existing process variables
// retain precedence because dotenv's override option defaults to false.
config({ path: process.env.DOTENV_CONFIG_PATH ?? repositoryEnvPath, quiet: true });

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const env = {
  port: Number(process.env.PORT ?? 4000),
  nodeEnv: process.env.NODE_ENV ?? "development",
  engineUrl: (process.env.PROSPECTING_ENGINE_URL ?? "http://localhost:8000").replace(/\/+$/, ""),
  engineApiKey: required("PROSPECTING_API_KEY"),
  sessionPassword: required("CONSOLE_SESSION_PASSWORD"),
  sessionSecret: required("CONSOLE_SESSION_SECRET"),
  // Set to the number of trusted reverse-proxy hops (usually 1) when this
  // server sits behind one that terminates TLS and forwards
  // X-Forwarded-Proto. Without this, Express's req.protocol reads "http"
  // even for real HTTPS traffic, and the session cookie's `secure` flag
  // (on in production — see auth.ts) silently fails to be set: the
  // `cookies` package throws rather than send a secure cookie over what it
  // believes is plaintext, and cookie-session swallows that error. Login
  // would appear to succeed (204) but no session cookie would ever arrive.
  trustProxy: parseTrustProxy(process.env.TRUST_PROXY),
};

/** Mirrors Express's own accepted `trust proxy` values: a boolean, a hop
 * count, or a preset/address string — see expressjs.com/en/guide/behind-proxies.html. */
function parseTrustProxy(value: string | undefined): boolean | number | string {
  if (value === undefined || value === "") return false;
  if (value === "true") return true;
  if (value === "false") return false;
  if (/^\d+$/.test(value)) return Number(value);
  return value;
}
