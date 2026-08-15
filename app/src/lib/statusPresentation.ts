import type { AnalysisStatus, CapabilityRunStatus, TestRunStatus } from "./types";

export type ChipVariant = "active" | "good" | "warning" | "critical" | "muted";

export interface StatusPresentation {
  label: string;
  variant: ChipVariant;
}

const ANALYSIS_LABELS: Record<AnalysisStatus, string> = {
  queued: "Queued",
  submitting_test: "Submitting test",
  waiting_for_test: "Waiting for test",
  analyzing: "Analyzing",
  synthesizing: "Synthesizing",
  completed: "Completed",
  completed_partial: "Completed (partial)",
  failed: "Failed",
};

export function analysisStatusPresentation(status: AnalysisStatus): StatusPresentation {
  const label = ANALYSIS_LABELS[status];
  if (status === "completed") return { label, variant: "good" };
  if (status === "completed_partial") return { label, variant: "warning" };
  if (status === "failed") return { label, variant: "critical" };
  return { label, variant: "active" };
}

const TEST_RUN_LABELS: Record<TestRunStatus, string> = {
  queued: "Queued",
  submitting: "Submitting",
  pending: "Pending",
  running: "Running",
  completed: "Completed",
  failed: "Failed",
};

export function testRunStatusPresentation(status: TestRunStatus): StatusPresentation {
  const label = TEST_RUN_LABELS[status];
  if (status === "completed") return { label, variant: "good" };
  if (status === "failed") return { label, variant: "critical" };
  return { label, variant: "active" };
}

const CAPABILITY_RUN_LABELS: Record<CapabilityRunStatus, string> = {
  queued: "Queued",
  running: "Running",
  completed: "Completed",
  skipped_insufficient_evidence: "Skipped",
  failed: "Failed",
};

export function capabilityRunStatusPresentation(status: CapabilityRunStatus): StatusPresentation {
  const label = CAPABILITY_RUN_LABELS[status];
  if (status === "completed") return { label, variant: "good" };
  if (status === "failed") return { label, variant: "critical" };
  if (status === "skipped_insufficient_evidence") return { label, variant: "muted" };
  return { label, variant: "active" };
}

/** Human-readable capability names for the five production diagnostic
 * agents (config/performance_capabilities.json in the backend). Falls back
 * to the raw id for any capability not in this table. */
const CAPABILITY_NAMES: Record<string, string> = {
  "loading-rendering": "Loading & Rendering",
  "page-composition": "Page Composition",
  "runtime-interactivity": "Runtime & Interactivity",
  "delivery-infrastructure": "Delivery Infrastructure",
  "external-dependencies": "External Dependencies",
};

export function capabilityName(capabilityId: string): string {
  return CAPABILITY_NAMES[capabilityId] ?? capabilityId;
}
