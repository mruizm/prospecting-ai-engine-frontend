import { ChangeDetectionStrategy, Component, input } from "@angular/core";
import { CardModule } from "primeng/card";
import type { CapabilityRun, TestRun } from "../../lib/types";
import {
  capabilityName,
  capabilityRunStatusPresentation,
  testRunStatusPresentation,
} from "../../lib/statusPresentation";
import { StatusChipComponent } from "./status-chip.component";
import { EmptyStateComponent } from "../ui/components/empty-state.component";

@Component({
  selector: "app-test-runs",
  imports: [CardModule, StatusChipComponent, EmptyStateComponent],
  template: `
    @if (runs().length === 0) { <app-empty-state title="No test runs submitted yet" icon="pi pi-clock" /> }
    @else {
      <div class="run-grid">
        @for (run of runs(); track run.id; let index = $index) {
          <p-card styleClass="run-card"><div class="run-card-top">
            <span class="run-card-title">{{ run.purpose || 'Run ' + (index + 1) }}</span>
            <app-status-chip [label]="testStatus(run).label" [variant]="testStatus(run).variant" />
          </div><div class="run-card-meta">
            <span>{{ run.required ? 'Required' : 'Optional' }} · {{ run.poll_attempts }} attempt{{ run.poll_attempts === 1 ? '' : 's' }}</span>
            @if (run.status_message) { <span>{{ run.status_message }}</span> }
            @if (run.reused_from_test_run_id) { <span class="mono">reused</span> }
          </div></p-card>
        }
      </div>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TestRunsComponent {
  readonly runs = input.required<TestRun[]>();
  readonly testStatus = (run: TestRun) => testRunStatusPresentation(run.status);
}

@Component({
  selector: "app-capability-runs",
  imports: [CardModule, StatusChipComponent, EmptyStateComponent],
  template: `
    @if (runs().length === 0) { <app-empty-state title="Diagnostic agents haven't started yet" icon="pi pi-sparkles" /> }
    @else {
      <div class="run-grid">
        @for (run of runs(); track run.id) {
          <p-card styleClass="run-card"><div class="run-card-top">
            <span class="run-card-title">{{ name(run.capability_id) }}</span>
            <app-status-chip [label]="status(run).label" [variant]="status(run).variant" />
          </div><div class="run-card-meta">
            <span>v{{ run.capability_version }} · {{ run.attempts }} attempt{{ run.attempts === 1 ? '' : 's' }}</span>
            @if (run.error_message) { <span>{{ run.error_message }}</span> }
          </div></p-card>
        }
      </div>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CapabilityRunsComponent {
  readonly runs = input.required<CapabilityRun[]>();
  readonly name = capabilityName;
  readonly status = (run: CapabilityRun) => capabilityRunStatusPresentation(run.status);
}
