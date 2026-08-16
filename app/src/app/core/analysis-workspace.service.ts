import { Injectable, inject, signal } from "@angular/core";
import type { AnalysisSummary } from "../../lib/types";
import { ApiService } from "./api.service";

const SIDEBAR_LIMIT = 8;

@Injectable({ providedIn: "root" })
export class AnalysisWorkspaceService {
  readonly recent = signal<AnalysisSummary[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  private readonly api = inject(ApiService);

  async refreshRecent(): Promise<void> {
    if (this.loading()) return;
    this.loading.set(true);
    try {
      const response = await this.api.listAnalyses({ limit: SIDEBAR_LIMIT });
      this.recent.set(response.items);
      this.error.set(null);
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : "Could not load recent analyses");
    } finally {
      this.loading.set(false);
    }
  }

  updateRecent(items: AnalysisSummary[]): void {
    this.recent.set(items.slice(0, SIDEBAR_LIMIT));
  }
}
