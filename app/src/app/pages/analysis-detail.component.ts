import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, inject, signal } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { ButtonModule } from "primeng/button";
import { CardModule } from "primeng/card";
import { MessageModule } from "primeng/message";
import type { AnalysisStatusResponse } from "../../lib/types";
import { TERMINAL_ANALYSIS_STATUSES } from "../../lib/types";
import { analysisStatusPresentation } from "../../lib/statusPresentation";
import { ApiService } from "../core/api.service";
import { CapabilityRunsComponent, TestRunsComponent } from "../shared/run-cards.component";
import { StatusChipComponent } from "../shared/status-chip.component";
import { StepperComponent } from "../shared/stepper.component";
import { TimelineComponent } from "../shared/timeline.component";
import { ErrorStateComponent } from "../ui/components/error-state.component";
import { LoadingStateComponent } from "../ui/components/loading-state.component";
import { PageHeaderComponent } from "../ui/components/page-header.component";

@Component({
  selector: "app-analysis-detail",
  imports: [ButtonModule, CardModule, MessageModule, CapabilityRunsComponent, TestRunsComponent, StatusChipComponent, StepperComponent, TimelineComponent, ErrorStateComponent, LoadingStateComponent, PageHeaderComponent],
  template: `<section class="view">
    @if (loading()) { <app-loading-state message="Loading analysis…" /> }
    @else if (error()) { <app-error-state [message]="'Could not load this analysis: ' + error()" retryLabel="Retry" (retry)="retry()" /> }
    @else if (analysis(); as item) {
      <app-page-header [title]="item.company_name" [subtitle]="item.url + ' · ' + item.preset_id + ' · ' + item.id">
        <app-status-chip [label]="presentation(item).label" [variant]="presentation(item).variant" />
      </app-page-header>
      <app-stepper [status]="item.status" [progress]="item.progress" />
      @if (item.warnings.length) { <p-message severity="warn" [text]="item.warnings.length + ' warning' + (item.warnings.length === 1 ? ': ' : 's: ') + item.warnings.join(' · ')" /> }
      @if (item.status === 'failed') { <p-message severity="error" [text]="(item.error_code || 'Analysis failed') + '. ' + (item.error_message || '')" /> }
      @if (item.report_url) { <p-card styleClass="report-ready"><div class="report-ready-content"><div><b>Report ready.</b> <span class="cell-muted">Findings, opportunities, and talking points.</span></div>
        <p-button label="View report" icon="pi pi-arrow-right" iconPos="right" size="small" (onClick)="openReport(item.id)" /></div></p-card> }
      <div class="section-title">Test runs</div><app-test-runs [runs]="item.test_runs" />
      <div class="section-title">Capability agents</div><app-capability-runs [runs]="item.capability_runs" />
      <div class="section-title">Event timeline</div><p-card><app-timeline [events]="item.events" /></p-card>
    }
  </section>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AnalysisDetailComponent implements OnInit, OnDestroy {
  readonly analysis = signal<AnalysisStatusResponse | null>(null); readonly loading = signal(true); readonly error = signal<string | null>(null);
  readonly presentation = (item: AnalysisStatusResponse) => analysisStatusPresentation(item.status);
  private readonly id = inject(ActivatedRoute).snapshot.paramMap.get("id") ?? "";
  private readonly api = inject(ApiService); private readonly router = inject(Router); private timer?: number;
  ngOnInit(): void { void this.refresh(); }
  ngOnDestroy(): void { window.clearTimeout(this.timer); }
  retry(): void { this.loading.set(true); void this.refresh(); }
  openReport(id: string): void { void this.router.navigate(["/analyses", id, "report"]); }
  private async refresh(): Promise<void> {
    try {
      const item = await this.api.fetchAnalysis(this.id); this.analysis.set(item); this.error.set(null);
      if (!(TERMINAL_ANALYSIS_STATUSES as readonly string[]).includes(item.status)) this.timer = window.setTimeout(() => void this.refresh(), 3500);
    } catch (error) { this.error.set(error instanceof Error ? error.message : "Unknown error"); }
    finally { this.loading.set(false); }
  }
}
