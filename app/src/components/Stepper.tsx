import { ANALYSIS_STATUS_STEPS, type AnalysisStatus } from "../lib/types";
import { analysisStatusPresentation } from "../lib/statusPresentation";

interface StepperProps {
  status: AnalysisStatus;
  /** AnalysisStatusResponse.progress — a stage-specific object; only
   * `progress.stage` is read here, to place a `failed` analysis on the
   * step it was on when it failed. */
  progress: Record<string, unknown>;
}

export function Stepper({ status, progress }: StepperProps) {
  const currentIndex = resolveStepIndex(status, progress);

  return (
    <div className="stepper">
      {ANALYSIS_STATUS_STEPS.map((step, index) => {
        let stateClass = "";
        if (status === "failed" && index === currentIndex) stateClass = "failed";
        else if (index < currentIndex) stateClass = "done";
        else if (index === currentIndex && status !== "failed") stateClass = "current";

        return (
          <div key={step} className={`step ${stateClass}`}>
            <div className="step-line" />
            <div className="step-dot" />
            <div className="step-label">{analysisStatusPresentation(step).label}</div>
          </div>
        );
      })}
    </div>
  );
}

function resolveStepIndex(status: AnalysisStatus, progress: Record<string, unknown>): number {
  if (status === "completed" || status === "completed_partial") {
    return ANALYSIS_STATUS_STEPS.length - 1;
  }
  if (status === "failed") {
    const stage = typeof progress.stage === "string" ? progress.stage : undefined;
    const stageIndex = stage ? ANALYSIS_STATUS_STEPS.indexOf(stage as AnalysisStatus) : -1;
    return stageIndex === -1 ? 0 : stageIndex;
  }
  const index = ANALYSIS_STATUS_STEPS.indexOf(status);
  return index === -1 ? 0 : index;
}
