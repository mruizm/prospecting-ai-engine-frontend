import { ChangeDetectionStrategy, Component, input, output } from "@angular/core";
import { ButtonModule } from "primeng/button";
import { MessageModule } from "primeng/message";

@Component({
  selector: "app-error-state",
  imports: [ButtonModule, MessageModule],
  template: `<div class="app-error-state"><p-message severity="error" [text]="message()" />@if (retryLabel()) { <p-button [label]="retryLabel()" icon="pi pi-refresh" severity="secondary" [outlined]="true" size="small" (onClick)="retry.emit()" /> }</div>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ErrorStateComponent {
  readonly message = input.required<string>();
  readonly retryLabel = input("");
  readonly retry = output<void>();
}
