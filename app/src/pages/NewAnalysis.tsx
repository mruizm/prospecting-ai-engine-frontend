import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useCreateAnalysis } from "../hooks/useCreateAnalysis";
import { usePresets } from "../hooks/usePresets";
import { useToast } from "../components/Toast";
import { IconArrowRight } from "../components/icons";

export function NewAnalysis() {
  const presets = usePresets();
  const createAnalysis = useCreateAnalysis();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [companyName, setCompanyName] = useState("");
  const [url, setUrl] = useState("");
  const [presetId, setPresetId] = useState<string | null>(null);
  const [wptTestId, setWptTestId] = useState("");

  const selectedPreset = presetId ?? presets.data?.find((p) => p.is_default)?.id ?? presets.data?.[0]?.id;

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    createAnalysis.mutate(
      {
        company_name: companyName,
        url,
        preset_id: selectedPreset ?? null,
        wpt_test_id: wptTestId.trim() || null,
      },
      {
        onSuccess: (accepted) => {
          showToast("Analysis accepted — queued for processing");
          navigate(`/analyses/${accepted.id}`);
        },
      },
    );
  }

  return (
    <section className="view">
      <div className="page-head">
        <div>
          <h1>New analysis</h1>
          <div className="page-sub">Runs WebPageTest, then five diagnostic agents, then synthesizes a cited report.</div>
        </div>
      </div>

      <form className="card form-card card-pad" onSubmit={handleSubmit}>
        {createAnalysis.isError && (
          <div className="form-banner error">{createAnalysis.error.message}</div>
        )}

        <div className="field">
          <label htmlFor="companyName">Company name</label>
          <input
            id="companyName"
            type="text"
            required
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            placeholder="e.g. Solstice Dental Group"
          />
          <div className="field-hint">
            Used as prospect context in the report — not treated as measured evidence.
          </div>
        </div>

        <div className="field">
          <label htmlFor="url">URL</label>
          <input
            id="url"
            type="url"
            required
            className="mono"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://www.example.com/"
          />
        </div>

        <div className="field">
          <label>Collection preset</label>
          <div className="preset-options">
            {presets.isLoading && <div className="cell-muted">Loading presets…</div>}
            {presets.isError && <div className="field-error">Couldn't load presets: {presets.error.message}</div>}
            {presets.data?.map((preset) => (
              <label
                key={preset.id}
                className={`preset-option ${selectedPreset === preset.id ? "selected" : ""}`}
              >
                <input
                  type="radio"
                  name="preset"
                  checked={selectedPreset === preset.id}
                  onChange={() => setPresetId(preset.id)}
                />
                <div className="preset-option-text">
                  <div className="preset-option-title mono">{preset.id}</div>
                  <div className="preset-option-desc">{preset.description}</div>
                </div>
                {preset.is_default && <span className="preset-default">Default</span>}
              </label>
            ))}
          </div>
        </div>

        <div className="field">
          <label htmlFor="wptTestId">
            Existing WebPageTest ID <span style={{ fontWeight: 400, color: "var(--ink-muted)" }}>(optional)</span>
          </label>
          <input
            id="wptTestId"
            type="text"
            className="mono"
            value={wptTestId}
            onChange={(e) => setWptTestId(e.target.value)}
            placeholder="e.g. 240815_AB_1c2"
          />
          <div className="field-hint">Reuses a persisted result instead of submitting a new paid test.</div>
        </div>

        <div className="form-actions">
          <button className="btn btn-primary" type="submit" disabled={createAnalysis.isPending}>
            <IconArrowRight />
            {createAnalysis.isPending ? "Starting…" : "Start analysis"}
          </button>
          <button className="btn btn-ghost" type="button" onClick={() => navigate("/")}>
            Cancel
          </button>
        </div>
      </form>
    </section>
  );
}
