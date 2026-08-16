import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { Router } from "@angular/router";
import { MessageService } from "primeng/api";
import { ButtonModule } from "primeng/button";
import { CardModule } from "primeng/card";
import { InputTextModule } from "primeng/inputtext";
import { MessageModule } from "primeng/message";
import { RadioButtonModule } from "primeng/radiobutton";
import type { Preset } from "../../lib/types";
import { ApiService } from "../core/api.service";
import { AnalysisWorkspaceService } from "../core/analysis-workspace.service";
import { PageHeaderComponent } from "../ui/components/page-header.component";

@Component({
  selector: "app-new-analysis",
  imports: [FormsModule, ButtonModule, CardModule, InputTextModule, MessageModule, RadioButtonModule, PageHeaderComponent],
  template: `<section class="view"><app-page-header title="New analysis" subtitle="Runs WebPageTest, then five diagnostic agents, then synthesizes a cited report." />
    <p-card styleClass="form-card"><form (ngSubmit)="submit()">
      @if (error()) { <p-message severity="error" [text]="error()!" /> }
      <div class="field"><label for="companyName">Company name</label><input pInputText id="companyName" name="companyName" required
        [(ngModel)]="companyName" placeholder="e.g. Solstice Dental Group" fluid />
        <div class="field-hint">Used as prospect context in the report — not treated as measured evidence.</div></div>
      <div class="field"><label for="url">URL</label><input pInputText id="url" name="url" type="url" required class="mono"
        [(ngModel)]="url" placeholder="https://www.example.com/" fluid /></div>
      <div class="field"><label>Collection preset</label><div class="preset-options">
        @if (loadingPresets()) { <div class="cell-muted">Loading presets…</div> }
        @if (presetError()) { <p-message severity="error" [text]="presetError()!" /> }
        @for (preset of presets(); track preset.id) {
          <label class="preset-option" [class.selected]="selectedPreset() === preset.id">
            <p-radiobutton name="preset" [value]="preset.id" [(ngModel)]="presetId" [inputId]="'preset-' + preset.id" />
            <div class="preset-option-text"><div class="preset-option-title mono">{{ preset.id }}</div>
              <div class="preset-option-desc">{{ preset.description }}</div></div>
            @if (preset.is_default) { <span class="preset-default">Default</span> }
          </label>
        }
      </div></div>
      <div class="field"><label for="wptTestId">Existing WebPageTest ID <span class="cell-muted">(optional)</span></label>
        <input pInputText id="wptTestId" name="wptTestId" class="mono" [(ngModel)]="wptTestId" placeholder="e.g. 240815_AB_1c2" fluid />
        <div class="field-hint">Reuses a persisted result instead of submitting a new paid test.</div></div>
      <div class="form-actions"><p-button label="Start analysis" icon="pi pi-arrow-right" type="submit" [loading]="pending()" />
        <p-button label="Cancel" severity="secondary" [text]="true" type="button" (onClick)="cancel()" /></div>
    </form></p-card></section>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NewAnalysisComponent implements OnInit {
  companyName = ""; url = ""; presetId = ""; wptTestId = "";
  readonly presets = signal<Preset[]>([]); readonly loadingPresets = signal(true);
  readonly presetError = signal<string | null>(null); readonly pending = signal(false); readonly error = signal<string | null>(null);
  private readonly api = inject(ApiService); private readonly router = inject(Router);
  private readonly workspace = inject(AnalysisWorkspaceService); private readonly messages = inject(MessageService);

  ngOnInit(): void { void this.loadPresets(); }
  selectedPreset(): string { return this.presetId || this.presets().find((item) => item.is_default)?.id || this.presets()[0]?.id || ""; }
  cancel(): void { void this.router.navigateByUrl("/"); }

  async submit(): Promise<void> {
    if (!this.companyName || !this.url || this.pending()) return;
    this.pending.set(true); this.error.set(null);
    const preset = this.selectedPreset();
    try {
      const accepted = await this.api.createAnalysis({ company_name: this.companyName, url: this.url, preset_id: preset || null, wpt_test_id: this.wptTestId.trim() || null });
      await this.workspace.refreshRecent();
      this.messages.add({ severity: "success", summary: "Analysis accepted", detail: "Queued for processing" });
      await this.router.navigate(["/analyses", accepted.id]);
    } catch (error) { this.error.set(error instanceof Error ? error.message : "Could not start analysis."); }
    finally { this.pending.set(false); }
  }

  private async loadPresets(): Promise<void> {
    try { const presets = await this.api.fetchPresets(); this.presets.set(presets); this.presetId = presets.find((item) => item.is_default)?.id ?? presets[0]?.id ?? ""; }
    catch (error) { this.presetError.set(`Couldn't load presets: ${error instanceof Error ? error.message : 'unknown error'}`); }
    finally { this.loadingPresets.set(false); }
  }
}
