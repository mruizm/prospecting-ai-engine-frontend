import { useMemo, useState, type ReactNode } from "react";
import { Link, useParams } from "react-router-dom";
import { useReport } from "../hooks/useReport";
import { ReportNotReadyError, ReportUnavailableError } from "../lib/api";
import { capabilityName } from "../lib/statusPresentation";
import type { EvidenceItem, Priority } from "../lib/types";
import { Bars, type BarDatum } from "../components/Bars";
import { FindingCard } from "../components/FindingCard";
import { IconLightbulb, IconWarning } from "../components/icons";

const PRIORITY_ORDER: Priority[] = ["critical", "high", "medium", "low", "informational"];

type Filter = "all" | Priority | "recommendation";

export function Report() {
  const { id } = useParams<{ id: string }>();
  const { data: report, isLoading, error } = useReport(id);
  const [filter, setFilter] = useState<Filter>("all");

  if (isLoading) {
    return (
      <section className="view">
        <div className="state-block">
          <div className="spinner" />
          <span>Loading report…</span>
        </div>
      </section>
    );
  }

  if (error instanceof ReportNotReadyError) {
    return (
      <section className="view">
        <div className="state-block">
          <div className="spinner" />
          <span>Report isn't ready yet — synthesis is still running.</span>
        </div>
        <Link className="btn btn-ghost btn-sm" to={`/analyses/${id}`}>
          Back to progress
        </Link>
      </section>
    );
  }

  if (error instanceof ReportUnavailableError) {
    return (
      <section className="view">
        <div className="error-banner">
          <IconWarning />
          <div>This analysis failed before producing a report.</div>
        </div>
        <Link className="btn btn-ghost btn-sm" to={`/analyses/${id}`}>
          Back to progress
        </Link>
      </section>
    );
  }

  if (error || !report) {
    return (
      <section className="view">
        <div className="error-banner">
          <IconWarning />
          <div>Couldn't load this report{error ? `: ${error.message}` : "."}</div>
        </div>
      </section>
    );
  }

  return <ReportView report={report} filter={filter} onFilterChange={setFilter} />;
}

function ReportView({
  report,
  filter,
  onFilterChange,
}: {
  report: NonNullable<ReturnType<typeof useReport>["data"]>;
  filter: Filter;
  onFilterChange: (f: Filter) => void;
}) {
  const evidenceById = useMemo(() => {
    const map = new Map<string, EvidenceItem>();
    for (const item of report.evidence) map.set(item.id, item);
    return map;
  }, [report.evidence]);

  const priorityCounts = useMemo(() => countBy(report.findings, (f) => f.priority), [report.findings]);
  const recommendationCount = report.findings.filter((f) => f.statement_type === "recommendation").length;
  const visibleFindings = report.findings.filter((f) => {
    if (filter === "all") return true;
    if (filter === "recommendation") return f.statement_type === "recommendation";
    return f.priority === filter;
  });

  const bytesBars = useMemo(() => buildBytesBars(report.evidence), [report.evidence]);
  const evidenceByNamespace = useMemo(() => groupBy(report.evidence, (item) => item.namespace), [report.evidence]);

  return (
    <section className="view">
      <div className="report-head">
        <div>
          <div className="crumb" style={{ marginBottom: 6 }}>
            Report for
          </div>
          <h1 className="company-title">{report.company_name}</h1>
        </div>
        <CoverageBadge coverage={report.coverage} />
      </div>

      <div className="card summary-card">
        <h2>Executive summary</h2>
        <p className="summary-text">{report.executive_summary}</p>
        <p className="narrative-text">{report.narrative}</p>
      </div>

      <div className="two-col">
        <div>
          <div className="section-title">Findings</div>
          <div className="filter-row">
            <FilterPill active={filter === "all"} onClick={() => onFilterChange("all")}>
              All ({report.findings.length})
            </FilterPill>
            {PRIORITY_ORDER.filter((p) => priorityCounts[p]).map((p) => (
              <FilterPill key={p} active={filter === p} onClick={() => onFilterChange(p)}>
                {capitalize(p)} ({priorityCounts[p]})
              </FilterPill>
            ))}
            {recommendationCount > 0 && (
              <FilterPill active={filter === "recommendation"} onClick={() => onFilterChange("recommendation")}>
                Recommendations ({recommendationCount})
              </FilterPill>
            )}
          </div>
          {visibleFindings.length === 0 ? (
            <div className="state-block">No findings in this category.</div>
          ) : (
            visibleFindings.map((finding) => (
              <FindingCard key={finding.id} finding={finding} evidenceById={evidenceById} />
            ))
          )}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="card card-pad">
            <h2 className="side-card-title">Prioritized opportunities</h2>
            {report.prioritized_opportunities.length === 0 ? (
              <div className="cell-muted">No opportunities were surfaced for this run.</div>
            ) : (
              <div className="opp-list">
                {report.prioritized_opportunities.map((opp, i) => (
                  <div className="opp-item" key={opp.id}>
                    <span className="opp-num mono">{String(i + 1).padStart(2, "0")}</span>
                    <span className="opp-text">{opp.title}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {bytesBars.length > 0 && (
            <div className="card card-pad">
              <h2 className="side-card-title">Byte-weighted evidence</h2>
              <Bars data={bytesBars} />
            </div>
          )}

          <div className="card card-pad">
            <h2 className="side-card-title">Talking points</h2>
            <div className="talking-points">
              {report.talking_points.map((point, i) => (
                <div className="tp-item" key={i}>
                  <IconLightbulb />
                  <span>{point}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="section-title">Evidence appendix</div>
      <div className="card card-pad">
        {Object.entries(evidenceByNamespace).map(([namespace, items]) => (
          <details key={namespace} style={{ marginBottom: 8 }}>
            <summary style={{ cursor: "pointer", fontSize: 12.5, fontWeight: 650 }}>
              <span className="mono">{namespace}</span> · {items.length} record{items.length === 1 ? "" : "s"}
            </summary>
            <div className="evidence-list" style={{ marginTop: 8 }}>
              {items.map((item) => (
                <div className="evidence-row" key={item.id}>
                  <span className="evidence-name">{item.name}</span>
                  <span className="evidence-value">
                    {String(item.value)}
                    {item.unit ? ` ${item.unit}` : ""}
                  </span>
                </div>
              ))}
            </div>
          </details>
        ))}
      </div>

      <div className="card card-pad" style={{ marginTop: 16 }}>
        <h2 className="side-card-title">Methodology</h2>
        <p style={{ fontSize: 12.5, color: "var(--ink-secondary)", lineHeight: 1.6 }}>{report.methodology}</p>
      </div>

      <div className="meta-foot">
        <span>
          Schema <b>{report.schema_version}</b>
        </span>
        <span>
          Model <b>{report.model_id}</b>
        </span>
        <span>
          Generated <b>{new Date(report.generated_at).toLocaleString()}</b>
        </span>
      </div>
    </section>
  );
}

function CoverageBadge({ coverage }: { coverage: NonNullable<ReturnType<typeof useReport>["data"]>["coverage"] }) {
  return (
    <div className="coverage-badge">
      <div className="coverage-dots">
        {coverage.configured.map((id) => {
          let color = "var(--surface-3)";
          let title = `${capabilityName(id)} — not run`;
          if (coverage.completed.includes(id)) {
            color = "var(--good)";
            title = `${capabilityName(id)} — completed`;
          } else if (coverage.failed.includes(id)) {
            color = "var(--critical)";
            title = `${capabilityName(id)} — failed`;
          } else if (coverage.skipped.includes(id)) {
            color = "var(--surface-3)";
            title = `${capabilityName(id)} — skipped`;
          }
          return <span key={id} style={{ background: color }} title={title} />;
        })}
      </div>
      <div>
        <b>
          {coverage.completed.length} / {coverage.configured.length}
        </b>
        <div className="cell-muted">capabilities complete</div>
      </div>
    </div>
  );
}

function FilterPill({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button className={`filter-pill ${active ? "active" : ""}`} onClick={onClick} type="button">
      {children}
    </button>
  );
}

function countBy<T, K extends string>(items: T[], keyFn: (item: T) => K): Partial<Record<K, number>> {
  const result: Partial<Record<K, number>> = {};
  for (const item of items) {
    const key = keyFn(item);
    result[key] = (result[key] ?? 0) + 1;
  }
  return result;
}

function groupBy<T>(items: T[], keyFn: (item: T) => string): Record<string, T[]> {
  const result: Record<string, T[]> = {};
  for (const item of items) {
    const key = keyFn(item);
    (result[key] ??= []).push(item);
  }
  return result;
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function buildBytesBars(evidence: EvidenceItem[]): BarDatum[] {
  return evidence
    .filter((item): item is EvidenceItem & { value: number } => item.namespace === "bytes" && typeof item.value === "number")
    .sort((a, b) => b.value - a.value)
    .slice(0, 5)
    .map((item) => ({
      label: humanizeEvidenceName(item.name),
      value: item.value,
      displayValue: formatBytes(item.value, item.unit),
    }));
}

function humanizeEvidenceName(name: string): string {
  return name
    .replace(/_/g, " ")
    .replace(/\bbytes\b/gi, "")
    .trim()
    .replace(/^./, (c) => c.toUpperCase()) || name;
}

function formatBytes(value: number, unit: string | null): string {
  if (unit && unit !== "bytes") return `${value} ${unit}`;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)} MB`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)} KB`;
  return `${value} B`;
}
