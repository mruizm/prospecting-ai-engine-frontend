import { ChangeDetectionStrategy, Component, input } from "@angular/core";
import { TagModule } from "primeng/tag";
import type { ChipVariant } from "../../lib/statusPresentation";

@Component({
  selector: "app-status-chip",
  imports: [TagModule],
  template: `<p-tag [value]="label()" [severity]="severity()" [rounded]="true" />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatusChipComponent {
  readonly label = input.required<string>();
  readonly variant = input.required<ChipVariant>();

  severity(): "success" | "info" | "warn" | "danger" | "secondary" {
    const variants = {
      active: "info",
      good: "success",
      warning: "warn",
      critical: "danger",
      muted: "secondary",
    } as const;
    return variants[this.variant()];
  }
}
