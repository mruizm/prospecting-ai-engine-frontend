import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, computed, inject, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { AccordionModule } from "primeng/accordion";
import { MessageService } from "primeng/api";
import { ButtonModule } from "primeng/button";
import { CardModule } from "primeng/card";
import { IconFieldModule } from "primeng/iconfield";
import { InputIconModule } from "primeng/inputicon";
import { InputTextModule } from "primeng/inputtext";
import { MessageModule } from "primeng/message";
import { ProgressBarModule } from "primeng/progressbar";
import { TagModule } from "primeng/tag";
import { ActivatedRoute, Router } from "@angular/router";
import type { EvidenceItem, Finding, PerformanceReport, Priority } from "../../lib/types";
import { capabilityName } from "../../lib/statusPresentation";
import { ApiService, ReportNotReadyError, ReportUnavailableError } from "../core/api.service";
import { EmptyStateComponent } from "../ui/components/empty-state.component";
import { ErrorStateComponent } from "../ui/components/error-state.component";
import { LoadingStateComponent } from "../ui/components/loading-state.component";
import { PageHeaderComponent } from "../ui/components/page-header.component";

const PRIORITIES: Priority[] = ["critical", "high", "medium", "low", "informational"];
type Filter = "all" | Priority | "recommendation";
interface BarDatum { label: string; value: number; display: string; }
interface SummaryPoint { id: string; text: string; evidenceRefs: string[]; }
interface TalkingPointItem { id: string; text: string; evidenceRefs: string[]; }

@Component({
  selector: "app-report",
  imports: [FormsModule, AccordionModule, ButtonModule, CardModule, IconFieldModule, InputIconModule, InputTextModule, MessageModule, ProgressBarModule, TagModule, EmptyStateComponent, ErrorStateComponent, LoadingStateComponent, PageHeaderComponent],
  template: `<section class="view report-view">
    @if (loading()) { <app-loading-state message="Loading report…" /> }
    @else if (notReady()) { <app-loading-state message="Report isn't ready yet — synthesis is still running." />
      <p-button label="Back to progress" icon="pi pi-arrow-left" severity="secondary" [text]="true" (onClick)="back()" /> }
    @else if (unavailable()) { <app-error-state message="This analysis failed before producing a report." />
      <p-button label="Back to progress" icon="pi pi-arrow-left" severity="secondary" [text]="true" (onClick)="back()" /> }
    @else if (error()) { <app-error-state [message]="'Could not load this report: ' + error()" retryLabel="Retry" (retry)="retry()" /> }
    @else if (report(); as item) {
      <app-page-header [title]="item.company_name" subtitle="Evidence-grounded performance report">
        <p-button label="Copy summary" icon="pi pi-copy" severity="secondary" [outlined]="true" size="small" (onClick)="copy(item.executive_summary, 'Executive summary copied')" />
      </app-page-header>

      <p-card styleClass="coverage-card"><div class="coverage-summary"><div class="coverage-heading"><div><strong>{{ item.coverage.completed.length }} / {{ item.coverage.configured.length }}</strong>
        <span>capabilities complete</span></div><p-tag [value]="item.coverage.complete ? 'Complete' : 'Partial'" [severity]="item.coverage.complete ? 'success' : 'warn'" /></div>
        <div class="coverage-progress-block" [class.complete]="item.coverage.complete"><div class="coverage-progress-label">
          <span>Diagnostic coverage</span><strong>{{ coveragePercentLabel(item) }}%</strong></div>
          <p-progressbar [value]="coveragePercent(item)" [showValue]="false" /></div></div>
        <div class="coverage-tags">@for (capability of item.coverage.configured; track capability) {
          <p-tag [value]="capabilityName(capability)" [severity]="coverageSeverity(item, capability)" [title]="coverageTitle(item, capability)" />
        }</div>
      </p-card>

      <div class="two-col"><div class="findings-column">
        <p-card styleClass="summary-card"><ng-template #title>Executive summary</ng-template>
          <div class="summary-list">@for (point of summaryPoints(); track point.id) {
            <p-accordion [multiple]="true"><p-accordion-panel [value]="point.id">
              <p-accordion-header><span class="summary-point-header"><i class="pi pi-chevron-down" aria-hidden="true"></i><span>{{ point.text }}</span></span></p-accordion-header>
              <p-accordion-content><div class="summary-point-evidence">
                @for (reference of point.evidenceRefs; track reference) { <p-tag [value]="reference" severity="info" /> }
              </div></p-accordion-content>
            </p-accordion-panel></p-accordion>
          }</div>
        </p-card>
      </div><div class="report-side">
        <p-card><ng-template #title>Prioritized opportunities</ng-template>
          @if (!item.prioritized_opportunities.length) { <app-empty-state title="No opportunities surfaced" icon="pi pi-check-circle" /> }
          <div class="opp-list">@for (opportunity of item.prioritized_opportunities; track opportunity.id; let index = $index) {
            <div class="opp-item"><span class="opp-num mono">{{ pad(index + 1) }}</span><span class="opp-text">{{ opportunity.title }}</span></div> }</div>
        </p-card>
        @if (bars().length) { <p-card><ng-template #title>Byte-weighted evidence</ng-template><div class="bars">
          @for (bar of bars(); track bar.label; let index = $index) { <div class="bar-row"><span class="bar-label">{{ bar.label }}</span><div class="bar-track">
            <div class="bar-fill" [style.width.%]="barWidth(bar.value)" [style.background]="seriesColor(index)"></div></div><span class="bar-value mono">{{ bar.display }}</span></div> }
        </div></p-card> }
        <p-card><ng-template #title>Talking points</ng-template><ng-template #header><div class="card-header-action"><p-button label="Copy all" icon="pi pi-copy" size="small" severity="secondary" [text]="true" (onClick)="copy(item.talking_points.join('\n'), 'Talking points copied')" /></div></ng-template>
          @if (talkingPointItems().length === 0) { <app-empty-state title="No talking points produced" icon="pi pi-comments" /> }
          @else { <p-accordion [multiple]="true" styleClass="talking-points-accordion">
            @for (point of talkingPointItems(); track point.id) { <p-accordion-panel [value]="point.id">
              <p-accordion-header><span class="talking-point-header"><i class="pi pi-lightbulb" aria-hidden="true"></i><span>{{ point.text }}</span></span></p-accordion-header>
              <p-accordion-content><div class="talking-point-evidence">
                @for (reference of point.evidenceRefs; track reference) { <p-tag [value]="reference" severity="info" /> }
              </div></p-accordion-content>
            </p-accordion-panel> }
          </p-accordion> }
        </p-card>
      </div></div>

      <p-card styleClass="findings-card"><ng-template #title>Findings</ng-template><div class="filter-row">
        <p-button [label]="'All (' + item.findings.length + ')'" size="small" [outlined]="filter() !== 'all'" (onClick)="filter.set('all')" />
        @for (priority of priorities; track priority) { @if (priorityCount(priority)) {
          <p-button [label]="capitalize(priority) + ' (' + priorityCount(priority) + ')'" size="small" severity="secondary" [outlined]="filter() !== priority" (onClick)="filter.set(priority)" />
        } }
        @if (recommendationCount()) { <p-button [label]="'Recommendations (' + recommendationCount() + ')'" size="small" severity="secondary" [outlined]="filter() !== 'recommendation'" (onClick)="filter.set('recommendation')" /> }
      </div>
      @if (visibleFindings().length === 0) { <app-empty-state title="No findings in this category" icon="pi pi-search" /> }
      @else { <p-accordion [multiple]="true" styleClass="findings-accordion">
        @for (finding of visibleFindings(); track finding.id) { <p-accordion-panel [value]="finding.id">
          <p-accordion-header><div class="finding-header-content"><p-tag [value]="finding.priority" [severity]="prioritySeverity(finding.priority)" />
            <span class="finding-title">{{ finding.title }}</span><p-tag [value]="finding.statement_type" severity="secondary" />
            <span class="finding-conf">{{ confidence(finding) }}%</span></div></p-accordion-header>
          <p-accordion-content><div class="finding-statement">{{ finding.statement }}</div><div class="evidence-list">
            @if (evidenceFor(finding).length === 0) { <span class="cell-muted">No evidence records resolved for this finding.</span> }
            @for (evidence of evidenceFor(finding); track evidence.id) { <div class="evidence-row"><span class="evidence-ns mono">{{ evidence.namespace }}</span>
              <span class="evidence-name">{{ evidence.name }}</span><span class="evidence-value">{{ evidence.value }}{{ evidence.unit ? ' ' + evidence.unit : '' }}</span></div> }
          </div><p-button label="Copy finding" icon="pi pi-copy" size="small" severity="secondary" [text]="true" (onClick)="copyFinding(finding)" /></p-accordion-content>
        </p-accordion-panel> }
      </p-accordion> }
      </p-card>

      <p-card styleClass="evidence-appendix-card"><div class="evidence-appendix-head"><div class="section-title">Evidence appendix</div>
        <p-iconfield><p-inputicon class="pi pi-search" /><input pInputText type="search" aria-label="Search evidence by ID"
          placeholder="Search by evidence ID" fluid [ngModel]="evidenceQuery()" (ngModelChange)="evidenceQuery.set($event)" /></p-iconfield>
      </div>
      @if (filteredEvidenceGroups().length === 0) { <app-empty-state title="No evidence IDs match this search" icon="pi pi-search" /> }
      @else { <p-accordion [multiple]="true">
        @for (group of filteredEvidenceGroups(); track group.namespace) { <p-accordion-panel [value]="group.namespace"><p-accordion-header>
          <span class="evidence-group-header"><span class="mono">{{ group.namespace }}</span>
            <span class="evidence-record-count">{{ group.items.length }} record{{ group.items.length === 1 ? '' : 's' }}</span></span>
        </p-accordion-header><p-accordion-content><div class="evidence-list">@for (evidence of group.items; track evidence.id) {
          <div class="evidence-row appendix-evidence-row"><span class="evidence-id mono">{{ evidence.id }}</span><span class="evidence-name">{{ evidence.name }}</span><span class="evidence-value">{{ evidence.value }}{{ evidence.unit ? ' ' + evidence.unit : '' }}</span></div>
        }</div></p-accordion-content></p-accordion-panel> }
      </p-accordion> }</p-card>
      <p-card styleClass="methodology"><ng-template #title>Methodology</ng-template><p>{{ item.methodology }}</p></p-card>
      <div class="meta-foot"><span>Schema <b>{{ item.schema_version }}</b></span><span>Model <b>{{ item.model_id }}</b></span><span>Generated <b>{{ formatDate(item.generated_at) }}</b></span></div>
    }
  </section>`,
  styles: [`.report-side{display:flex;flex-direction:column;gap:16px}.methodology{margin-top:16px}.methodology p{font-size:12.5px;color:var(--ink-secondary);line-height:1.6}.card-header-action{display:flex;justify-content:flex-end;padding:.5rem 1rem 0}`],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReportComponent implements OnInit, OnDestroy {
  readonly id = inject(ActivatedRoute).snapshot.paramMap.get("id") ?? "";
  readonly report = signal<PerformanceReport | null>(null);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly notReady = signal(false);
  readonly unavailable = signal(false);
  readonly filter = signal<Filter>("all");
  readonly evidenceQuery = signal("");
  readonly priorities = PRIORITIES;
  readonly capabilityName = capabilityName;
  readonly visibleFindings = computed(() => (this.report()?.findings ?? []).filter((finding) => this.filter() === "all" || (this.filter() === "recommendation" ? finding.statement_type === "recommendation" : finding.priority === this.filter())));
  readonly recommendationCount = computed(() => (this.report()?.findings ?? []).filter((finding) => finding.statement_type === "recommendation").length);
  readonly evidenceGroups = computed(() => {
    const groups = new Map<string, EvidenceItem[]>();
    for (const item of this.report()?.evidence ?? []) groups.set(item.namespace, [...(groups.get(item.namespace) ?? []), item]);
    return [...groups].map(([namespace, items]) => ({ namespace, items }));
  });
  readonly filteredEvidenceGroups = computed(() => {
    const query = this.evidenceQuery().trim().toLowerCase();
    if (!query) return this.evidenceGroups();
    return this.evidenceGroups()
      .map((group) => ({ ...group, items: group.items.filter((item) => item.id.toLowerCase().includes(query)) }))
      .filter((group) => group.items.length > 0);
  });
  readonly summaryPoints = computed(() => buildSummaryPoints(this.report()));
  readonly talkingPointItems = computed(() => buildTalkingPointItems(this.report()));
  readonly bars = computed(() => buildBars(this.report()?.evidence ?? []));
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);
  private readonly messages = inject(MessageService);
  private timer?: number;

  ngOnInit(): void { void this.load(); }
  ngOnDestroy(): void { window.clearTimeout(this.timer); }
  back(): void { void this.router.navigate(["/analyses", this.id]); }
  retry(): void { this.loading.set(true); this.error.set(null); void this.load(); }
  priorityCount(priority: Priority): number { return this.report()?.findings.filter((finding) => finding.priority === priority).length ?? 0; }
  confidence(finding: Finding): number { return Math.round(finding.confidence * 100); }
  evidenceFor(finding: Finding): EvidenceItem[] { const ids = new Set(finding.evidence_refs); return (this.report()?.evidence ?? []).filter((item) => ids.has(item.id)); }
  coveragePercent(item: PerformanceReport): number { return item.coverage.configured.length ? item.coverage.completed.length / item.coverage.configured.length * 100 : 0; }
  coveragePercentLabel(item: PerformanceReport): number { return Math.round(this.coveragePercent(item)); }
  coverageSeverity(item: PerformanceReport, id: string): "success" | "danger" | "secondary" { return item.coverage.completed.includes(id) ? "success" : item.coverage.failed.includes(id) ? "danger" : "secondary"; }
  coverageTitle(item: PerformanceReport, id: string): string { const state = item.coverage.completed.includes(id) ? "completed" : item.coverage.failed.includes(id) ? "failed" : item.coverage.skipped.includes(id) ? "skipped" : "not run"; return `${capabilityName(id)} — ${state}`; }
  prioritySeverity(priority: Priority): "danger" | "warn" | "info" | "secondary" { return priority === "critical" || priority === "high" ? "danger" : priority === "medium" ? "warn" : priority === "informational" ? "info" : "secondary"; }
  barWidth(value: number): number { return Math.max(2, value / Math.max(1, ...this.bars().map((bar) => bar.value)) * 100); }
  seriesColor(index: number): string { return `var(--series-${index + 1})`; }
  capitalize(value: string): string { return value.charAt(0).toUpperCase() + value.slice(1); }
  pad(value: number): string { return String(value).padStart(2, "0"); }
  formatDate(value: string): string { return new Date(value).toLocaleString(); }
  async copy(value: string, detail: string): Promise<void> { await navigator.clipboard.writeText(value); this.messages.add({ severity: "success", summary: "Copied", detail }); }
  async copyFinding(finding: Finding): Promise<void> { await this.copy(`${finding.title}\n\n${finding.statement}`, "Finding copied"); }

  private async load(): Promise<void> {
    try { this.report.set(await this.api.fetchReport(this.id)); this.notReady.set(false); this.error.set(null); }
    catch (error) {
      if (error instanceof ReportNotReadyError) { this.notReady.set(true); this.timer = window.setTimeout(() => void this.load(), 4000); }
      else if (error instanceof ReportUnavailableError) this.unavailable.set(true);
      else this.error.set(error instanceof Error ? error.message : "Unknown error");
    } finally { this.loading.set(false); }
  }
}

function buildSummaryPoints(report: PerformanceReport | null): SummaryPoint[] {
  if (!report) return [];
  const blocks = [report.executive_summary, ...report.narrative.split(/\n\s*\n/)]
    .map((block) => block.trim())
    .filter(Boolean);

  return blocks.map((block, index) => ({
    id: `summary-point-${index}`,
    text: stripCitations(block),
    evidenceRefs: citationRefs(block),
  }));
}

function buildTalkingPointItems(report: PerformanceReport | null): TalkingPointItem[] {
  if (!report) return [];
  return report.talking_points.map((point, index) => {
    return {
      id: `talking-point-${index}`,
      text: stripCitations(point),
      evidenceRefs: citationRefs(point),
    };
  });
}

function citationRefs(text: string): string[] {
  return [...new Set([...text.matchAll(/\[(EVID-[A-Z0-9_]+-[a-f0-9]+)\]/g)].map((match) => match[1]))];
}

function stripCitations(text: string): string {
  return text
    .replace(/\s*\[EVID-[A-Z0-9_]+-[a-f0-9]+\]/g, "")
    .replace(/\s+([,.;:])/g, "$1")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function buildBars(evidence: EvidenceItem[]): BarDatum[] {
  return evidence.filter((item): item is EvidenceItem & { value: number } => item.namespace === "bytes" && typeof item.value === "number")
    .sort((a, b) => b.value - a.value).slice(0, 5).map((item) => ({
      label: item.name.replace(/_/g, " ").replace(/\bbytes\b/gi, "").trim().replace(/^./, (char) => char.toUpperCase()) || item.name,
      value: item.value,
      display: item.unit && item.unit !== "bytes" ? `${item.value} ${item.unit}` : item.value >= 1_000_000 ? `${(item.value / 1_000_000).toFixed(1)} MB` : item.value >= 1_000 ? `${(item.value / 1_000).toFixed(1)} KB` : `${item.value} B`,
    }));
}
