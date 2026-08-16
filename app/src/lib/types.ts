/**
 * Mirrors prospecting-ai-engine-backend's src/prospecting_engine/schemas.py
 * and src/prospecting_engine/models.py field-for-field. Keep in sync with
 * that file when the backend's response schemas change — see backend
 * README.md "API response schemas" for the canonical version.
 */

export type AnalysisStatus =
  | "queued"
  | "submitting_test"
  | "waiting_for_test"
  | "analyzing"
  | "synthesizing"
  | "completed"
  | "completed_partial"
  | "failed";

export type TestRunStatus = "queued" | "submitting" | "pending" | "running" | "completed" | "failed";

export type CapabilityRunStatus =
  | "queued"
  | "running"
  | "completed"
  | "skipped_insufficient_evidence"
  | "failed";

export type EvidenceNamespace =
  | "page"
  | "timing"
  | "vitals"
  | "requests"
  | "bytes"
  | "metadata"
  | "loading"
  | "visual"
  | "resource"
  | "runtime"
  | "delivery"
  | "third_party"
  | "technology";

export type StatementType = "fact" | "inference" | "recommendation";
export type Priority = "critical" | "high" | "medium" | "low" | "informational";
export type EventLevel = "info" | "warning" | "error";

export const TERMINAL_ANALYSIS_STATUSES: readonly AnalysisStatus[] = [
  "completed",
  "completed_partial",
  "failed",
];

export const ANALYSIS_STATUS_STEPS: readonly AnalysisStatus[] = [
  "queued",
  "submitting_test",
  "waiting_for_test",
  "analyzing",
  "synthesizing",
  "completed",
];

export interface AnalysisCreateRequest {
  company_name: string;
  url: string;
  preset_id?: string | null;
  wpt_test_id?: string | null;
  prospect_context?: Record<string, unknown>;
}

export interface AnalysisAccepted {
  id: string;
  status: AnalysisStatus;
  status_url: string;
  report_url: string;
  created_at: string;
}

export interface AnalysisSummary {
  id: string;
  company_name: string;
  url: string;
  preset_id: string;
  status: AnalysisStatus;
  progress_percent: number;
  wpt_test_id: string | null;
  warning_count: number;
  capabilities_completed: number;
  capabilities_total: number;
  report_available: boolean;
  created_at: string;
  completed_at: string | null;
}

export interface AnalysisListResponse {
  items: AnalysisSummary[];
  next_cursor: string | null;
}

export interface AnalysisListParams {
  status?: AnalysisStatus;
  query?: string;
  company_name?: string;
  url?: string;
  created_from?: string;
  created_to?: string;
  limit?: number;
  cursor?: string;
}

export interface TestRun {
  id: string;
  preset_id: string;
  purpose: string;
  required: boolean;
  status: TestRunStatus;
  status_message: string | null;
  poll_attempts: number;
  submitted_at: string | null;
  completed_at: string | null;
  reused_from_test_run_id: string | null;
}

export interface CapabilityRun {
  id: string;
  capability_id: string;
  capability_version: string;
  evidence_version: string;
  status: CapabilityRunStatus;
  attempts: number;
  error_message: string | null;
  started_at: string | null;
  completed_at: string | null;
}

export interface AnalysisEvent {
  id: string;
  event_type: string;
  stage: string;
  level: EventLevel;
  capability_id: string | null;
  message: string;
  details: Record<string, unknown>;
  created_at: string;
}

export interface AnalysisStatusResponse {
  id: string;
  company_name: string;
  url: string;
  preset_id: string;
  status: AnalysisStatus;
  progress: Record<string, unknown>;
  wpt_test_id: string | null;
  requested_wpt_test_id: string | null;
  warnings: string[];
  error_code: string | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  expires_at: string;
  report_url: string | null;
  test_runs: TestRun[];
  capability_runs: CapabilityRun[];
  events: AnalysisEvent[];
}

export interface EvidenceItem {
  id: string;
  namespace: EvidenceNamespace;
  name: string;
  value: string | number | boolean | null;
  unit: string | null;
  source_path: string;
  context: Record<string, unknown>;
}

export interface Finding {
  id: string;
  title: string;
  statement: string;
  statement_type: StatementType;
  priority: Priority;
  confidence: number;
  evidence_refs: string[];
}

export interface ReportCoverage {
  configured: string[];
  completed: string[];
  failed: string[];
  skipped: string[];
  complete: boolean;
}

export interface PerformanceReport {
  schema_version: "1.0";
  analysis_id: string;
  company_name: string;
  executive_summary: string;
  narrative: string;
  findings: Finding[];
  prioritized_opportunities: Finding[];
  talking_points: string[];
  coverage: ReportCoverage;
  methodology: string;
  evidence: EvidenceItem[];
  generated_at: string;
  model_id: string;
}

export interface Preset {
  id: string;
  description: string;
  is_default: boolean;
}
