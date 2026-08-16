import { ChangeDetectionStrategy, Component, inject, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { Router } from "@angular/router";
import { ButtonModule } from "primeng/button";
import { CardModule } from "primeng/card";
import { MessageModule } from "primeng/message";
import { PasswordModule } from "primeng/password";
import { ApiError, ApiService } from "../core/api.service";

@Component({
  selector: "app-login",
  imports: [FormsModule, ButtonModule, CardModule, MessageModule, PasswordModule],
  template: `<div class="login-screen"><p-card styleClass="login-card"><form (ngSubmit)="submit()">
    <div class="brand"><div class="brand-mark">▥</div><div><div class="brand-name">Prospecting Console</div>
      <div class="brand-tag">evidence-grounded diagnostics</div></div></div>
    <div class="field"><label for="password">Password</label><p-password inputId="password" autofocus
      [(ngModel)]="password" name="password" [feedback]="false" [toggleMask]="true" [fluid]="true" required />
      @if (error()) { <p-message severity="error" [text]="error()!" /> }
    </div>
    <p-button label="Sign in" icon="pi pi-sign-in" type="submit" [loading]="pending()" [disabled]="!password" [fluid]="true" />
  </form></p-card></div>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent {
  password = "";
  readonly pending = signal(false);
  readonly error = signal<string | null>(null);
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);

  async submit(): Promise<void> {
    if (!this.password || this.pending()) return;
    this.pending.set(true); this.error.set(null);
    try { await this.api.login(this.password); await this.router.navigateByUrl("/"); }
    catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        this.error.set("Incorrect password. Use CONSOLE_SESSION_PASSWORD from the frontend .env file.");
      } else if (error instanceof TypeError) {
        this.error.set("Cannot reach the console server. Start it with npm run dev:server.");
      } else {
        this.error.set(error instanceof Error ? error.message : "Sign-in failed. Check the console server logs.");
      }
    }
    finally { this.pending.set(false); }
  }
}
