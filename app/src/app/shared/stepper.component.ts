import { ChangeDetectionStrategy, Component, input } from "@angular/core";
import { StepperModule } from "primeng/stepper";
import { ANALYSIS_STATUS_STEPS, type AnalysisStatus } from "../../lib/types";
import { analysisStatusPresentation } from "../../lib/statusPresentation";

@Component({
  selector: "app-stepper",
  imports: [StepperModule],
  template: `
    <p-stepper [value]="currentValue()" [linear]="true" styleClass="analysis-stepper"><p-step-list>
      @for (step of steps; track step; let index = $index) { <p-step [value]="index + 1" [disabled]="index > currentIndex()">{{ label(step) }}</p-step> }
    </p-step-list></p-stepper>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StepperComponent {
  readonly status = input.required<AnalysisStatus>();
  readonly progress = input.required<Record<string, unknown>>();
  readonly steps = ANALYSIS_STATUS_STEPS;
  readonly label = (status: AnalysisStatus): string => analysisStatusPresentation(status).label;

  currentValue(): number { return this.currentIndex() + 1; }

  currentIndex(): number {
    const status = this.status();
    if (status === "completed" || status === "completed_partial") return this.steps.length - 1;
    if (status === "failed") {
      const stage = typeof this.progress()["stage"] === "string" ? this.progress()["stage"] : undefined;
      const index = stage ? this.steps.indexOf(stage as AnalysisStatus) : -1;
      return index < 0 ? 0 : index;
    }
    const index = this.steps.indexOf(status);
    return index < 0 ? 0 : index;
  }
}
