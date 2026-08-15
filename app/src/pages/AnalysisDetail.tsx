import { Link, useParams } from "react-router-dom";
import { useAnalysis } from "../hooks/useAnalysis";
import { analysisStatusPresentation } from "../lib/statusPresentation";
import { CapabilityRunGrid, TestRunGrid } from "../components/RunCards";
import { Stepper } from "../components/Stepper";
import { StatusChip } from "../components/StatusChip";
import { Timeline } from "../components/Timeline";
import { IconArrowRight, IconWarning } from "../components/icons";

export function AnalysisDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: analysis, isLoading, isError, error } = useAnalysis(id);

  if (isLoading) {
    return (
      <section className="view">
        <div className="state-block">
          <div className="spinner" />
          <span>Loading analysis…</span>
        </div>
      </section>
    );
  }

  if (isError || !analysis) {
    return (
      <section className="view">
        <div className="error-banner">
          <IconWarning />
          <div>Couldn't load this analysis{error ? `: ${error.message}` : "."}</div>
        </div>
      </section>
    );
  }

  const presentation = analysisStatusPresentation(analysis.status);

  return (
    <section className="view">
      <div className="status-head">
        <div>
          <h1 className="company-title">{analysis.company_name}</h1>
          <div className="company-url">
            {analysis.url} · {analysis.preset_id} · <span className="mono">{analysis.id}</span>
          </div>
        </div>
        <StatusChip {...presentation} />
      </div>

      <Stepper status={analysis.status} progress={analysis.progress} />

      {analysis.warnings.length > 0 && (
        <div className="warn-banner">
          <IconWarning />
          <div>
            <b>
              {analysis.warnings.length} warning{analysis.warnings.length === 1 ? "" : "s"}:
            </b>{" "}
            {analysis.warnings.join(" · ")}
          </div>
        </div>
      )}

      {analysis.status === "failed" && (
        <div className="error-banner">
          <IconWarning />
          <div>
            <b>{analysis.error_code ?? "Analysis failed"}.</b> {analysis.error_message}
          </div>
        </div>
      )}

      {analysis.report_url && (
        <div className="card card-pad" style={{ marginBottom: 22, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <b>Report ready.</b> <span className="cell-muted">Findings, opportunities, and talking points.</span>
          </div>
          <Link className="btn btn-primary btn-sm" to={`/analyses/${analysis.id}/report`}>
            View report
            <IconArrowRight />
          </Link>
        </div>
      )}

      <div className="section-title">Test runs</div>
      <TestRunGrid runs={analysis.test_runs} />

      <div className="section-title">Capability agents</div>
      <CapabilityRunGrid runs={analysis.capability_runs} />

      <div className="section-title">Event timeline</div>
      <div className="card card-pad">
        <Timeline events={analysis.events} />
      </div>
    </section>
  );
}
