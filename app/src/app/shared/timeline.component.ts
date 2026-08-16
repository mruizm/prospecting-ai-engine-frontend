import { ChangeDetectionStrategy, Component, input } from "@angular/core";
import { TimelineModule } from "primeng/timeline";
import type { AnalysisEvent } from "../../lib/types";
import { EmptyStateComponent } from "../ui/components/empty-state.component";

@Component({
  selector: "app-timeline",
  imports: [TimelineModule, EmptyStateComponent],
  template: `
    @if (events().length === 0) { <app-empty-state title="No events yet" icon="pi pi-history" /> }
    @else { <p-timeline [value]="events()" styleClass="analysis-timeline">
      <ng-template #marker let-event><span [class]="'event-marker ' + event.level"><i [class]="markerIcon(event.level)"></i></span></ng-template>
      <ng-template #content let-event><div class="timeline-content"><div class="tl-top"><span class="tl-msg">{{ event.message }}</span>
        <span class="tl-time mono">{{ formatTime(event.created_at) }}</span></div>
        <div class="tl-stage">{{ event.stage }}{{ event.capability_id ? ' · ' + event.capability_id : '' }}</div></div></ng-template>
    </p-timeline> }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TimelineComponent {
  readonly events = input.required<AnalysisEvent[]>();
  formatTime(iso: string): string {
    const date = new Date(iso);
    return Number.isNaN(date.getTime()) ? iso : date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  }
  markerIcon(level: string): string { return level === "error" ? "pi pi-times" : level === "warning" ? "pi pi-exclamation-triangle" : "pi pi-check"; }
}
