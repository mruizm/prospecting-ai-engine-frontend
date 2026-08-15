import type {
  AnalysisAccepted,
  AnalysisCreateRequest,
  AnalysisStatusResponse,
  PerformanceReport,
  Preset,
} from "./types";

export class ApiError extends Error {
  status: number;
  detail: string;

  constructor(status: number, detail: string) {
    super(detail);
    this.name = "ApiError";
    this.status = status;
    this.detail = detail;
  }
}

/** Thrown by fetchReport while the report hasn't been synthesized yet (425). */
export class ReportNotReadyError extends ApiError {}
/** Thrown by fetchReport when the analysis failed before producing a report (409). */
export class ReportUnavailableError extends ApiError {}

/** `path` must include its full prefix ("/api/v1/..." or "/auth/..."). */
async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: {
      "content-type": "application/json",
      ...init?.headers,
    },
  });

  if (res.status === 204) {
    return undefined as T;
  }

  const text = await res.text();
  const body = text ? safeJsonParse(text) : null;

  if (!res.ok) {
    const detail = extractDetail(body) ?? res.statusText;
    throw new ApiError(res.status, detail);
  }

  return body as T;
}

function safeJsonParse(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function extractDetail(body: unknown): string | null {
  if (body && typeof body === "object" && "detail" in body) {
    const { detail } = body as { detail: unknown };
    if (typeof detail === "string") return detail;
    if (Array.isArray(detail)) return detail.map((d) => JSON.stringify(d)).join("; ");
  }
  return null;
}

export function fetchPresets(): Promise<Preset[]> {
  return request<Preset[]>("/api/v1/performance/presets");
}

export function createAnalysis(
  payload: AnalysisCreateRequest,
  idempotencyKey?: string,
): Promise<AnalysisAccepted> {
  return request<AnalysisAccepted>("/api/v1/performance/analyses", {
    method: "POST",
    headers: idempotencyKey ? { "Idempotency-Key": idempotencyKey } : undefined,
    body: JSON.stringify(payload),
  });
}

export function fetchAnalysis(id: string): Promise<AnalysisStatusResponse> {
  return request<AnalysisStatusResponse>(`/api/v1/performance/analyses/${id}`);
}

export async function fetchReport(id: string): Promise<PerformanceReport> {
  try {
    return await request<PerformanceReport>(`/api/v1/performance/analyses/${id}/report`);
  } catch (err) {
    if (err instanceof ApiError && err.status === 425) {
      throw new ReportNotReadyError(err.status, err.detail);
    }
    if (err instanceof ApiError && err.status === 409) {
      throw new ReportUnavailableError(err.status, err.detail);
    }
    throw err;
  }
}

export async function login(password: string): Promise<void> {
  await request<void>("/auth/login", { method: "POST", body: JSON.stringify({ password }) });
}

export async function logout(): Promise<void> {
  await request<void>("/auth/logout", { method: "POST" });
}

export function fetchSession(): Promise<{ authenticated: boolean }> {
  return request<{ authenticated: boolean }>("/auth/session");
}
