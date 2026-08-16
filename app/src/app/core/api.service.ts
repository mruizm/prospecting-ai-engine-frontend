import { Injectable } from "@angular/core";
import type {
  AnalysisAccepted,
  AnalysisCreateRequest,
  AnalysisListParams,
  AnalysisListResponse,
  AnalysisStatusResponse,
  PerformanceReport,
  Preset,
} from "../../lib/types";

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly detail: string,
  ) {
    super(detail);
    this.name = "ApiError";
  }
}

export class ReportNotReadyError extends ApiError {}
export class ReportUnavailableError extends ApiError {}

@Injectable({ providedIn: "root" })
export class ApiService {
  listAnalyses(params: AnalysisListParams = {}): Promise<AnalysisListResponse> {
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null && value !== "") query.set(key, String(value));
    }
    const suffix = query.size ? `?${query.toString()}` : "";
    return this.request<AnalysisListResponse>(`/api/v1/performance/analyses${suffix}`);
  }

  fetchPresets(): Promise<Preset[]> {
    return this.request<Preset[]>("/api/v1/performance/presets");
  }

  createAnalysis(payload: AnalysisCreateRequest, idempotencyKey?: string): Promise<AnalysisAccepted> {
    return this.request<AnalysisAccepted>("/api/v1/performance/analyses", {
      method: "POST",
      headers: idempotencyKey ? { "Idempotency-Key": idempotencyKey } : undefined,
      body: JSON.stringify(payload),
    });
  }

  fetchAnalysis(id: string): Promise<AnalysisStatusResponse> {
    return this.request<AnalysisStatusResponse>(`/api/v1/performance/analyses/${id}`);
  }

  async fetchReport(id: string): Promise<PerformanceReport> {
    try {
      return await this.request<PerformanceReport>(`/api/v1/performance/analyses/${id}/report`);
    } catch (error) {
      if (error instanceof ApiError && error.status === 425) {
        throw new ReportNotReadyError(error.status, error.detail);
      }
      if (error instanceof ApiError && error.status === 409) {
        throw new ReportUnavailableError(error.status, error.detail);
      }
      throw error;
    }
  }

  login(password: string): Promise<void> {
    return this.request<void>("/auth/login", { method: "POST", body: JSON.stringify({ password }) });
  }

  logout(): Promise<void> {
    return this.request<void>("/auth/logout", { method: "POST" });
  }

  fetchSession(): Promise<{ authenticated: boolean }> {
    return this.request<{ authenticated: boolean }>("/auth/session");
  }

  private async request<T>(path: string, init?: RequestInit): Promise<T> {
    const response = await fetch(path, {
      ...init,
      headers: { "content-type": "application/json", ...init?.headers },
    });
    if (response.status === 204) return undefined as T;
    const text = await response.text();
    const body: unknown = text ? this.safeJsonParse(text) : null;
    if (!response.ok) throw new ApiError(response.status, this.extractDetail(body) ?? response.statusText);
    return body as T;
  }

  private safeJsonParse(text: string): unknown {
    try {
      return JSON.parse(text) as unknown;
    } catch {
      return text;
    }
  }

  private extractDetail(body: unknown): string | null {
    if (!body || typeof body !== "object" || !("detail" in body)) return null;
    const detail = (body as { detail: unknown }).detail;
    if (typeof detail === "string") return detail;
    return Array.isArray(detail) ? detail.map((item) => JSON.stringify(item)).join("; ") : null;
  }
}
