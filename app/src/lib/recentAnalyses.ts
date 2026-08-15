/**
 * The engine has no list-analyses endpoint yet (docs/PLAN.md §3), so the
 * Dashboard can only ever know about analyses this browser created. This
 * module is that client-side memory: a capped, newest-first list in
 * localStorage, written to on every successful POST /analyses. It's a
 * stand-in — once the backend ships a real list endpoint, this file and
 * the Dashboard's use of it should be deleted wholesale, not extended.
 */
import type { AnalysisAccepted } from "./types";

const STORAGE_KEY = "prospecting-console:recent-analyses";
const MAX_ENTRIES = 25;

export interface RecentAnalysis {
  id: string;
  company_name: string;
  url: string;
  preset_id: string;
  created_at: string;
}

export function readRecentAnalyses(): RecentAnalysis[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function rememberAnalysis(
  accepted: AnalysisAccepted,
  input: { company_name: string; url: string; preset_id: string },
): RecentAnalysis[] {
  const entry: RecentAnalysis = {
    id: accepted.id,
    company_name: input.company_name,
    url: input.url,
    preset_id: input.preset_id,
    created_at: accepted.created_at,
  };
  const next = [entry, ...readRecentAnalyses().filter((a) => a.id !== entry.id)].slice(0, MAX_ENTRIES);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
}
