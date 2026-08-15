import { useQuery } from "@tanstack/react-query";
import { fetchAnalysis } from "../lib/api";
import { TERMINAL_ANALYSIS_STATUSES } from "../lib/types";

const POLL_INTERVAL_MS = 3500;

export function isTerminal(status: string | undefined): boolean {
  return status !== undefined && (TERMINAL_ANALYSIS_STATUSES as readonly string[]).includes(status);
}

/**
 * Polls GET /analyses/{id} while the analysis is in flight and stops once
 * it reaches a terminal status — mirrors the engine's own adaptive polling
 * philosophy (docs/PLAN.md §5) rather than polling forever.
 */
export function useAnalysis(id: string | undefined) {
  return useQuery({
    queryKey: ["analysis", id],
    queryFn: () => fetchAnalysis(id as string),
    enabled: Boolean(id),
    refetchInterval: (query) => (isTerminal(query.state.data?.status) ? false : POLL_INTERVAL_MS),
  });
}
