import { useCallback, useEffect, useState } from "react";
import { readRecentAnalyses, type RecentAnalysis } from "../lib/recentAnalyses";

/** Re-reads on mount, focus, and same-tab navigation so a freshly created
 * analysis shows up immediately after redirecting back to the dashboard. */
export function useRecentAnalyses(): { recents: RecentAnalysis[]; refresh: () => void } {
  const [recents, setRecents] = useState<RecentAnalysis[]>(() => readRecentAnalyses());

  const refresh = useCallback(() => setRecents(readRecentAnalyses()), []);

  useEffect(() => {
    refresh();
    window.addEventListener("focus", refresh);
    return () => window.removeEventListener("focus", refresh);
  }, [refresh]);

  return { recents, refresh };
}
