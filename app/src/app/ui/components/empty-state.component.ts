import { ChangeDetectionStrategy, Component, output, input } from "@angular/core";
import { ButtonModule } from "primeng/button";

@Component({
  selector: "app-empty-state",
  imports: [ButtonModule],
  template: `<div class="state-block app-empty-state"><i [class]="icon()" aria-hidden="true"></i><strong>{{ title() }}</strong>@if (message()) { <span>{{ message() }}</span> }@if (actionLabel()) { <p-button [label]="actionLabel()" [icon]="actionIcon()" (onClick)="action.emit()" /> }</div>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmptyStateComponent {
  readonly title = input.required<string>();
  readonly message = input("");
  readonly icon = input("pi pi-inbox");
  readonly actionLabel = input("");
  readonly actionIcon = input("pi pi-plus");
  readonly action = output<void>();
}
