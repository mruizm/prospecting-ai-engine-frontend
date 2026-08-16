import { ChangeDetectionStrategy, Component, input } from "@angular/core";
import { ProgressSpinnerModule } from "primeng/progressspinner";

@Component({
  selector: "app-loading-state",
  imports: [ProgressSpinnerModule],
  template: `<div class="state-block"><p-progress-spinner strokeWidth="4" ariaLabel="Loading" /><span>{{ message() }}</span></div>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoadingStateComponent {
  readonly message = input("Loading…");
}
