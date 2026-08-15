import { useEffect, useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { useAnalysis } from "../hooks/useAnalysis";
import { useLogout } from "../hooks/useSession";
import { useRecentAnalyses } from "../hooks/useRecentAnalyses";
import { analysisStatusPresentation } from "../lib/statusPresentation";
import { IconDashboard, IconPlus, IconSignal, IconTheme } from "./icons";
import { StatusChip } from "./StatusChip";

type ThemeChoice = "system" | "light" | "dark";

function applyTheme(choice: ThemeChoice) {
  if (choice === "system") document.documentElement.removeAttribute("data-theme");
  else document.documentElement.setAttribute("data-theme", choice);
}

export function AppShell() {
  const { recents } = useRecentAnalyses();
  const logout = useLogout();
  const [theme, setTheme] = useState<ThemeChoice>("system");

  useEffect(() => applyTheme(theme), [theme]);

  function cycleTheme() {
    setTheme((current) => (current === "system" ? "light" : current === "light" ? "dark" : "system"));
  }

  return (
    <div className="shell">
      <nav className="rail" aria-label="Primary">
        <div className="brand">
          <div className="brand-mark">
            <IconSignal stroke="#fff" />
          </div>
          <div>
            <div className="brand-name">Prospecting Console</div>
            <div className="brand-tag">evidence&#8209;grounded diagnostics</div>
          </div>
        </div>

        <div className="nav">
          <NavLink to="/" end className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
            <IconDashboard />
            Dashboard
          </NavLink>
          <NavLink to="/new" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
            <IconPlus />
            New analysis
          </NavLink>
        </div>

        <div>
          <div className="nav-label">Recent analyses</div>
          <div className="rail-recent">
            {recents.length === 0 ? (
              <div className="rail-empty">Analyses you start will show up here.</div>
            ) : (
              recents.map((recent) => (
                <NavLink to={`/analyses/${recent.id}`} className="rail-row" key={recent.id}>
                  <div className="rail-row-top">
                    <RailRowStatus id={recent.id} />
                  </div>
                  <div className="rail-row-name">{recent.company_name}</div>
                  <div className="rail-row-meta">{new Date(recent.created_at).toLocaleDateString()}</div>
                </NavLink>
              ))
            )}
          </div>
        </div>

        <div className="rail-footer">
          <div className="avatar">MR</div>
          <div className="rail-footer-text">
            <div className="rail-footer-name">Marco Ruiz</div>
            <div className="rail-footer-role">Solutions consultant</div>
          </div>
          <button className="btn btn-ghost btn-sm" style={{ marginLeft: "auto" }} onClick={() => logout.mutate()}>
            Sign out
          </button>
        </div>
      </nav>

      <main className="main">
        <div className="topbar">
          <div className="crumb" />
          <div className="topbar-actions">
            <button className="btn btn-ghost btn-sm" onClick={cycleTheme} title={`Theme: ${theme}`}>
              <IconTheme />
              Theme
            </button>
            <NavLink to="/new" className="btn btn-primary btn-sm">
              <IconPlus />
              New analysis
            </NavLink>
          </div>
        </div>
        <Outlet />
      </main>
    </div>
  );
}

/** Reuses the same polling hook as the detail page, so a row here updates
 * live while its analysis is in flight and stops once it's terminal. */
function RailRowStatus({ id }: { id: string }) {
  const { data } = useAnalysis(id);
  if (!data) return <span className="rail-row-meta">…</span>;
  return <StatusChip {...analysisStatusPresentation(data.status)} />;
}
