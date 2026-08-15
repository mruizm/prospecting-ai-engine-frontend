import { capabilityName, capabilityRunStatusPresentation, testRunStatusPresentation } from "../lib/statusPresentation";
import type { CapabilityRun, TestRun } from "../lib/types";
import { StatusChip } from "./StatusChip";

export function TestRunGrid({ runs }: { runs: TestRun[] }) {
  if (runs.length === 0) {
    return <div className="state-block">No test runs submitted yet.</div>;
  }
  return (
    <div className="run-grid">
      {runs.map((run, index) => {
        const presentation = testRunStatusPresentation(run.status);
        return (
          <div className="run-card" key={run.id}>
            <div className="run-card-top">
              <span className="run-card-title">{runLabel(run, index)}</span>
              <StatusChip {...presentation} />
            </div>
            <div className="run-card-meta">
              <span>
                {run.required ? "Required" : "Optional"} · {run.poll_attempts} attempt{run.poll_attempts === 1 ? "" : "s"}
              </span>
              {run.status_message ? <span>{run.status_message}</span> : null}
              {run.reused_from_test_run_id ? <span className="mono">reused</span> : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function runLabel(run: TestRun, index: number): string {
  if (run.purpose) return run.purpose;
  return `Run ${index + 1}`;
}

export function CapabilityRunGrid({ runs }: { runs: CapabilityRun[] }) {
  if (runs.length === 0) {
    return <div className="state-block">Diagnostic agents haven't started yet.</div>;
  }
  return (
    <div className="run-grid">
      {runs.map((run) => {
        const presentation = capabilityRunStatusPresentation(run.status);
        return (
          <div className="run-card" key={run.id}>
            <div className="run-card-top">
              <span className="run-card-title">{capabilityName(run.capability_id)}</span>
              <StatusChip {...presentation} />
            </div>
            <div className="run-card-meta">
              <span>
                v{run.capability_version} · {run.attempts} attempt{run.attempts === 1 ? "" : "s"}
              </span>
              {run.error_message ? <span>{run.error_message}</span> : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}
