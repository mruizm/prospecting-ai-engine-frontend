import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  OnDestroy,
  OnInit,
  computed,
  inject,
  signal,
} from "@angular/core";
import { FormsModule } from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";
import { BadgeModule } from "primeng/badge";
import { ButtonModule } from "primeng/button";
import { CardModule } from "primeng/card";
import { DatePickerModule } from "primeng/datepicker";
import { IconFieldModule } from "primeng/iconfield";
import { InputIconModule } from "primeng/inputicon";
import { InputTextModule } from "primeng/inputtext";
import { ProgressBarModule } from "primeng/progressbar";
import { SelectModule } from "primeng/select";
import { TableModule } from "primeng/table";
import type { AnalysisListParams, AnalysisStatus, AnalysisSummary } from "../../lib/types";
import { TERMINAL_ANALYSIS_STATUSES } from "../../lib/types";
import { analysisStatusPresentation } from "../../lib/statusPresentation";
import { AnalysisWorkspaceService } from "../core/analysis-workspace.service";
import { ApiError, ApiService } from "../core/api.service";
import { StatusChipComponent } from "../shared/status-chip.component";
import { EmptyStateComponent } from "../ui/components/empty-state.component";
import { ErrorStateComponent } from "../ui/components/error-state.component";
import { LoadingStateComponent } from "../ui/components/loading-state.component";
import { PageHeaderComponent } from "../ui/components/page-header.component";

const PAGE_SIZE = 25;
const POLL_INTERVAL_MS = 5000;
const FILTER_DEBOUNCE_MS = 350;
const STATUS_OPTIONS: AnalysisStatus[] = [
  "queued",
  "submitting_test",
  "waiting_for_test",
  "analyzing",
  "synthesizing",
  "completed",
  "completed_partial",
  "failed",
];

@Component({
  selector: "app-dashboard",
  imports: [
    FormsModule,
    BadgeModule,
    ButtonModule,
    CardModule,
    DatePickerModule,
    IconFieldModule,
    InputIconModule,
    InputTextModule,
    ProgressBarModule,
    SelectModule,
    TableModule,
    StatusChipComponent,
    EmptyStateComponent,
    ErrorStateComponent,
    LoadingStateComponent,
    PageHeaderComponent,
  ],
  template: `<section class="view dashboard-view">
    <app-page-header title="Analyses" subtitle="Shared performance diagnostics across the sales and presales team." />

    <p-card styleClass="dashboard-filter-card"><div class="dashboard-filters">
      <div class="filter-field filter-search"><label for="analysisSearch">Company or domain</label>
        <p-iconfield><p-inputicon class="pi pi-search" /><input pInputText id="analysisSearch" type="search" [(ngModel)]="search" (ngModelChange)="queueFilterApply()" placeholder="Search analyses" fluid /></p-iconfield>
      </div>
      <div class="filter-field"><label for="analysisStatus">Status</label>
        <p-select inputId="analysisStatus" [options]="statusChoices" optionLabel="label" optionValue="value" [(ngModel)]="statusFilter" (ngModelChange)="queueFilterApply()" placeholder="All statuses" [showClear]="true" [fluid]="true" appendTo="body" />
      </div>
      <div class="filter-field"><label for="createdFrom">Created from</label>
        <p-datepicker inputId="createdFrom" [(ngModel)]="createdFrom" (ngModelChange)="queueFilterApply()" dateFormat="yy-mm-dd" [showIcon]="true" [showButtonBar]="true" [fluid]="true" appendTo="body" />
      </div>
      <div class="filter-field"><label for="createdTo">Created to</label>
        <p-datepicker inputId="createdTo" [(ngModel)]="createdTo" (ngModelChange)="queueFilterApply()" dateFormat="yy-mm-dd" [showIcon]="true" [showButtonBar]="true" [fluid]="true" appendTo="body" />
      </div>
      @if (hasFilters()) { <p-button label="Clear" icon="pi pi-filter-slash" severity="secondary" [text]="true" size="small" (onClick)="clearFilters()" /> }
    </div></p-card>

    @if (items().length) {
      <div class="stat-row">
        <p-card><div class="stat-tile-label">Visible</div><div class="stat-tile-value">{{ items().length }}</div></p-card>
        <p-card><div class="stat-tile-label">Active</div><div class="stat-tile-value">{{ activeCount() }}</div></p-card>
        <p-card><div class="stat-tile-label">Completed</div><div class="stat-tile-value">{{ completedCount() }}</div></p-card>
        <p-card><div class="stat-tile-label">Needs attention</div><div class="stat-tile-value">{{ attentionCount() }}</div></p-card>
      </div>
    }

    @if (loading() && items().length === 0) {
      <app-loading-state message="Loading analyses…" />
    } @else if (error() && items().length === 0) {
      <app-error-state [message]="'Could not load analyses. ' + error()" retryLabel="Retry" (retry)="retry()" />
    } @else if (items().length === 0) {
      <p-card><app-empty-state [title]="hasFilters() ? 'No analyses match these filters' : 'No analyses have been created yet'"
        [actionLabel]="hasFilters() ? 'Clear filters' : 'Start your first analysis'"
        [actionIcon]="hasFilters() ? 'pi pi-filter-slash' : 'pi pi-plus'" (action)="emptyAction()" /></p-card>
    } @else {
      @if (error()) { <app-error-state [message]="error() + ' Showing the last successful results.'" /> }
      <p-table [value]="items()" [tableStyle]="{ 'min-width': '68rem' }" [stripedRows]="true" [rowHover]="true">
        <ng-template #header><tr><th>Company</th><th>URL</th><th>Status</th><th>Progress</th><th>Coverage</th><th>Warnings</th><th>Created</th></tr></ng-template>
        <ng-template #body let-analysis><tr class="clickable" (click)="open(analysis.id)">
          <td><div class="cell-primary">{{ analysis.company_name }}</div><div class="cell-id mono">{{ analysis.preset_id }}</div></td>
          <td class="cell-muted mono">{{ hostOf(analysis.url) }}</td>
          <td><app-status-chip [label]="presentation(analysis).label" [variant]="presentation(analysis).variant" /></td>
          <td><div class="progress-cell"><p-progressbar [value]="analysis.progress_percent" [showValue]="false" /><span class="mono">{{ analysis.progress_percent }}%</span></div></td>
          <td class="cell-muted">{{ coverage(analysis) }}</td>
          <td><p-badge [value]="analysis.warning_count" [severity]="analysis.warning_count ? 'warn' : 'secondary'" /></td>
          <td class="cell-muted">{{ formatDate(analysis.created_at) }}</td>
        </tr></ng-template>
      </p-table>
      <div class="dashboard-footer">
        <span class="cell-muted">{{ items().length }} loaded</span>
        @if (nextCursor()) { <p-button label="Load more" icon="pi pi-chevron-down" severity="secondary" [outlined]="true" size="small" [loading]="loadingMore()" (onClick)="loadMore()" /> }
      </div>
    }
  </section>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent implements OnInit, OnDestroy {
  search = "";
  statusFilter: AnalysisStatus | "" = "";
  createdFrom: Date | null = null;
  createdTo: Date | null = null;
  readonly statusChoices = STATUS_OPTIONS.map((status) => ({ label: analysisStatusPresentation(status).label, value: status }));
  readonly items = signal<AnalysisSummary[]>([]);
  readonly nextCursor = signal<string | null>(null);
  readonly loading = signal(true);
  readonly loadingMore = signal(false);
  readonly error = signal<string | null>(null);
  readonly activeCount = computed(() => this.items().filter((item) => !this.isTerminal(item.status)).length);
  readonly completedCount = computed(() => this.items().filter((item) => item.status === "completed").length);
  readonly attentionCount = computed(() => this.items().filter((item) => item.status === "failed" || item.status === "completed_partial").length);
  readonly presentation = (item: AnalysisSummary) => analysisStatusPresentation(item.status);
  private readonly api = inject(ApiService);
  private readonly workspace = inject(AnalysisWorkspaceService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private pollTimer?: number;
  private filterTimer?: number;
  private requestVersion = 0;

  ngOnInit(): void {
    const params = this.route.snapshot.queryParamMap;
    this.search = params.get("query") ?? "";
    const status = params.get("status");
    this.statusFilter = STATUS_OPTIONS.includes(status as AnalysisStatus) ? status as AnalysisStatus : "";
    this.createdFrom = parseDateParam(params.get("from"));
    this.createdTo = parseDateParam(params.get("to"));
    void this.loadPage(true);
  }

  ngOnDestroy(): void {
    window.clearTimeout(this.pollTimer);
    window.clearTimeout(this.filterTimer);
    this.requestVersion += 1;
  }

  @HostListener("document:visibilitychange") onVisibilityChange(): void {
    if (!document.hidden && this.activeCount() > 0) void this.refreshActivePage();
  }

  hasFilters(): boolean { return Boolean(this.search.trim() || this.statusFilter || this.createdFrom || this.createdTo); }
  hostOf(url: string): string { try { return new URL(url).host; } catch { return url; } }
  formatDate(value: string): string { return new Date(value).toLocaleString(); }
  coverage(item: AnalysisSummary): string { return item.capabilities_total ? `${item.capabilities_completed}/${item.capabilities_total}` : "—"; }
  open(id: string): void { void this.router.navigate(["/analyses", id]); }
  newAnalysis(): void { void this.router.navigateByUrl("/new"); }
  emptyAction(): void { this.hasFilters() ? this.clearFilters() : this.newAnalysis(); }
  retry(): void { void this.loadPage(true); }

  queueFilterApply(): void {
    window.clearTimeout(this.filterTimer);
    this.filterTimer = window.setTimeout(() => void this.applyFilters(), FILTER_DEBOUNCE_MS);
  }

  clearFilters(): void {
    this.search = ""; this.statusFilter = ""; this.createdFrom = null; this.createdTo = null;
    window.clearTimeout(this.filterTimer);
    void this.applyFilters();
  }

  async loadMore(): Promise<void> {
    if (!this.nextCursor() || this.loadingMore()) return;
    await this.loadPage(false);
  }

  private async applyFilters(): Promise<void> {
    await this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        query: this.search.trim() || null,
        status: this.statusFilter || null,
        from: formatDateParam(this.createdFrom),
        to: formatDateParam(this.createdTo),
      },
      replaceUrl: true,
    });
    await this.loadPage(true);
  }

  private async loadPage(reset: boolean): Promise<void> {
    window.clearTimeout(this.pollTimer);
    const version = ++this.requestVersion;
    reset ? this.loading.set(true) : this.loadingMore.set(true);
    try {
      const response = await this.api.listAnalyses(this.listParams(reset ? undefined : this.nextCursor() ?? undefined));
      if (version !== this.requestVersion) return;
      const combined = reset ? response.items : uniqueById([...this.items(), ...response.items]);
      this.items.set(combined);
      this.nextCursor.set(response.next_cursor);
      this.error.set(null);
      if (!this.hasFilters()) this.workspace.updateRecent(combined);
    } catch (error) {
      if (version !== this.requestVersion) return;
      if (error instanceof ApiError && error.status === 401) {
        await this.router.navigate(["/login"], { queryParams: { returnUrl: this.router.url } });
        return;
      }
      this.error.set(error instanceof Error ? error.message : "Unknown error");
    } finally {
      if (version === this.requestVersion) { this.loading.set(false); this.loadingMore.set(false); this.schedulePoll(); }
    }
  }

  private async refreshActivePage(): Promise<void> {
    if (document.hidden || this.loading()) { this.schedulePoll(); return; }
    try {
      const refreshLimit = Math.min(Math.max(this.items().length, PAGE_SIZE), 100);
      const response = await this.api.listAnalyses(this.listParams(undefined, refreshLimit));
      const refreshedIds = new Set(response.items.map((item) => item.id));
      this.items.set([...response.items, ...this.items().filter((item) => !refreshedIds.has(item.id))]);
      if (this.items().length <= PAGE_SIZE) this.nextCursor.set(response.next_cursor);
      this.error.set(null);
      if (!this.hasFilters()) this.workspace.updateRecent(this.items());
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : "Could not refresh active analyses");
    } finally { this.schedulePoll(); }
  }

  private schedulePoll(): void {
    window.clearTimeout(this.pollTimer);
    if (this.activeCount() > 0) this.pollTimer = window.setTimeout(() => void this.refreshActivePage(), POLL_INTERVAL_MS);
  }

  private listParams(cursor?: string, limit = PAGE_SIZE): AnalysisListParams {
    return {
      limit,
      cursor,
      query: this.search.trim() || undefined,
      status: this.statusFilter || undefined,
      created_from: this.createdFrom ? `${formatDateParam(this.createdFrom)}T00:00:00.000Z` : undefined,
      created_to: this.createdTo ? `${formatDateParam(this.createdTo)}T23:59:59.999Z` : undefined,
    };
  }

  private isTerminal(status: AnalysisStatus): boolean {
    return (TERMINAL_ANALYSIS_STATUSES as readonly string[]).includes(status);
  }
}

function uniqueById(items: AnalysisSummary[]): AnalysisSummary[] {
  const seen = new Set<string>();
  return items.filter((item) => !seen.has(item.id) && Boolean(seen.add(item.id)));
}

function parseDateParam(value: string | null): Date | null {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatDateParam(value: Date | null): string | null {
  if (!value) return null;
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
