import { useState } from "react";
import type { EvidenceItem, Finding } from "../lib/types";
import { IconChevronRight } from "./icons";
import { PriorityTag } from "./PriorityTag";

interface FindingCardProps {
  finding: Finding;
  evidenceById: Map<string, EvidenceItem>;
}

export function FindingCard({ finding, evidenceById }: FindingCardProps) {
  const [open, setOpen] = useState(false);
  const evidence = finding.evidence_refs.map((ref) => evidenceById.get(ref)).filter((item): item is EvidenceItem => Boolean(item));

  return (
    <div className={`finding ${open ? "open" : ""}`}>
      <button className="finding-head" onClick={() => setOpen((v) => !v)} aria-expanded={open}>
        <IconChevronRight className="finding-chevron" />
        <PriorityTag priority={finding.priority} />
        <span className="finding-title">{finding.title}</span>
        <span className="type-tag">{finding.statement_type}</span>
        <span className="finding-conf">{Math.round(finding.confidence * 100)}%</span>
      </button>
      {open && (
        <div className="finding-body">
          <div className="finding-statement">{finding.statement}</div>
          <div className="evidence-list">
            {evidence.length === 0 ? (
              <div className="cell-muted">No evidence records resolved for this finding.</div>
            ) : (
              evidence.map((item) => (
                <div className="evidence-row" key={item.id}>
                  <span className="evidence-ns mono">{item.namespace}</span>
                  <span className="evidence-name">{item.name}</span>
                  <span className="evidence-value">
                    {String(item.value)}
                    {item.unit ? ` ${item.unit}` : ""}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
