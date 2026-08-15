import { useQuery } from "@tanstack/react-query";
import { fetchReport, ReportNotReadyError } from "../lib/api";

const POLL_INTERVAL_MS = 4000;

/**
 * GET /analyses/{id}/report returns 425 until synthesis finishes and 409
 * if the analysis failed without one (README.md "Error responses"). While
 * it's a 425 we keep polling; any other outcome (success or 409) stops.
 */
export function useReport(id: string | undefined) {
  return useQuery({
    queryKey: ["report", id],
    queryFn: () => fetchReport(id as string),
    enabled: Boolean(id),
    retry: false,
    refetchInterval: (query) => (query.state.error instanceof ReportNotReadyError ? POLL_INTERVAL_MS : false),
  });
}
