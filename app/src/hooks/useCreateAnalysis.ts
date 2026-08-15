import { useMutation } from "@tanstack/react-query";
import { createAnalysis } from "../lib/api";
import { rememberAnalysis } from "../lib/recentAnalyses";
import type { AnalysisCreateRequest } from "../lib/types";

export function useCreateAnalysis() {
  return useMutation({
    mutationFn: (payload: AnalysisCreateRequest) => createAnalysis(payload),
    onSuccess: (accepted, payload) => {
      rememberAnalysis(accepted, {
        company_name: payload.company_name,
        url: payload.url,
        preset_id: payload.preset_id ?? "default",
      });
    },
  });
}
