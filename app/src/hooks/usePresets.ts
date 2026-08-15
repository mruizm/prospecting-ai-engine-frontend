import { useQuery } from "@tanstack/react-query";
import { fetchPresets } from "../lib/api";

export function usePresets() {
  return useQuery({
    queryKey: ["presets"],
    queryFn: fetchPresets,
    staleTime: 5 * 60 * 1000,
  });
}
