import { useNavigate } from "react-router-dom";
import { useAnalysis } from "../hooks/useAnalysis";
import { useRecentAnalyses } from "../hooks/useRecentAnalyses";
import { analysisStatusPresentation } from "../lib/statusPresentation";
import type { RecentAnalysis } from "../lib/recentAnalyses";
import { StatusChip } from "../components/StatusChip";
import { IconInfo, IconPlus } from "../components/icons";

export function Dashboard() {
  const { recents } = useRecentAnalyses();
  const navigate = useNavigate();

  return (
    <section className="view">
      <div className="page-head">
        <div>
          <h1>Analyses</h1>
          <div className="page-sub">Performance diagnostics run against prospect sites.</div>
        </div>
      </div>

      <div className="empty-note">
        <IconInfo />
        <div>
          <b>This list is local to your browser.</b> The engine has no endpoint yet for listing
          analyses, so this table only shows analyses you've started here — see{" "}
          <code className="mono">docs/PLAN.md</code> §3.
        </div>
      </div>

      {recents.length === 0 ? (
        <div className="card card-pad">
          <div className="state-block" style={{ padding: "24px 4px" }}>
            <span>No analyses yet.</span>
            <button className="btn btn-primary btn-sm" onClick={() => navigate("/new")}>
              <IconPlus />
              Start your first analysis
            </button>
          </div>
        </div>
      ) : (
        <div className="card">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Company</th>
                  <th>URL</th>
                  <th>Preset</th>
                  <th>Status</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {recents.map((recent) => (
                  <DashboardRow key={recent.id} recent={recent} onOpen={() => navigate(`/analyses/${recent.id}`)} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}

function DashboardRow({ recent, onOpen }: { recent: RecentAnalysis; onOpen: () => void }) {
  const { data } = useAnalysis(recent.id);
  return (
    <tr className="clickable" onClick={onOpen}>
      <td className="cell-primary">{recent.company_name}</td>
      <td className="cell-muted mono">{hostOf(recent.url)}</td>
      <td className="cell-muted mono">{recent.preset_id}</td>
      <td>{data ? <StatusChip {...analysisStatusPresentation(data.status)} /> : <span className="cell-muted">…</span>}</td>
      <td className="cell-muted">{new Date(recent.created_at).toLocaleString()}</td>
    </tr>
  );
}

function hostOf(url: string): string {
  try {
    return new URL(url).host;
  } catch {
    return url;
  }
}
