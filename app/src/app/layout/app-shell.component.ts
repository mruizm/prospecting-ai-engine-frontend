import { ChangeDetectionStrategy, Component, HostListener, OnInit, inject } from "@angular/core";
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from "@angular/router";
import { ButtonModule } from "primeng/button";
import { ToastModule } from "primeng/toast";
import { ApiService } from "../core/api.service";
import { AnalysisWorkspaceService } from "../core/analysis-workspace.service";
import { ThemeService } from "../ui/theme/theme.service";

@Component({
  selector: "app-shell",
  imports: [RouterLink, RouterLinkActive, RouterOutlet, ButtonModule, ToastModule],
  template: `
    <div class="shell">
      <nav class="rail" aria-label="Primary">
        <div class="brand"><div class="brand-mark">▥</div><div>
          <div class="brand-name">Prospecting Console</div><div class="brand-tag">evidence-grounded diagnostics</div>
        </div></div>
        <div class="nav">
          <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}" class="nav-item">▦ Dashboard</a>
          <a routerLink="/new" routerLinkActive="active" class="nav-item">＋ New analysis</a>
        </div>
        <div class="rail-recent"><div class="nav-label">Recent analyses</div>
          @if (workspace.loading() && workspace.recent().length === 0) { <div class="rail-empty">Loading analyses…</div> }
          @else if (workspace.error() && workspace.recent().length === 0) { <div class="rail-empty">Recent analyses unavailable.</div> }
          @else if (workspace.recent().length === 0) { <div class="rail-empty">No analyses have been created yet.</div> }
          @for (recent of workspace.recent(); track recent.id) {
            <a [routerLink]="['/analyses', recent.id]" routerLinkActive="active" class="rail-row">
              <div class="rail-row-name">{{ recent.company_name }}</div>
              <div class="rail-row-meta">{{ formatDate(recent.created_at) }}</div>
            </a>
          }
        </div>
        <div class="rail-footer"><div class="avatar">MR</div><div class="rail-footer-text">
          <div class="rail-footer-name">Marco Ruiz</div><div class="rail-footer-role">Solutions consultant</div>
        </div><p-button label="Sign out" icon="pi pi-sign-out" size="small" [text]="true" (onClick)="signOut()" /></div>
      </nav>
      <main class="main"><div class="topbar"><div class="crumb"></div><div class="topbar-actions">
        <p-button label="Theme" icon="pi pi-palette" size="small" [text]="true" (onClick)="theme.cycle()" [title]="'Theme: ' + theme.choice()" />
        <p-button label="New analysis" icon="pi pi-plus" size="small" (onClick)="newAnalysis()" />
      </div></div><router-outlet /></main>
      <p-toast position="top-right" />
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppShellComponent implements OnInit {
  readonly workspace = inject(AnalysisWorkspaceService);
  readonly theme = inject(ThemeService);
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);

  ngOnInit(): void { void this.workspace.refreshRecent(); }

  @HostListener("window:focus") refresh(): void { void this.workspace.refreshRecent(); }

  async signOut(): Promise<void> {
    await this.api.logout();
    await this.router.navigateByUrl("/login");
  }

  newAnalysis(): void { void this.router.navigateByUrl("/new"); }

  formatDate(value: string): string { return new Date(value).toLocaleDateString(); }
}
