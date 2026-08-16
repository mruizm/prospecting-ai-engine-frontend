import { ChangeDetectionStrategy, Component, input } from "@angular/core";

@Component({
  selector: "app-page-header",
  template: `<header class="page-head"><div><h1>{{ title() }}</h1>@if (subtitle()) { <div class="page-sub">{{ subtitle() }}</div> }</div><div class="page-actions"><ng-content /></div></header>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PageHeaderComponent {
  readonly title = input.required<string>();
  readonly subtitle = input<string>("");
}
