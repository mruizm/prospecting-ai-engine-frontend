const SERIES_VARS = ["var(--series-1)", "var(--series-2)", "var(--series-3)", "var(--series-4)", "var(--series-5)"];

export interface BarDatum {
  label: string;
  value: number;
  displayValue: string;
}

/** Horizontal bars, categorical hues in fixed order, always direct-labeled
 * (never relying on color alone) — see the dataviz skill's mark specs.
 * Caps at 5 series; callers should fold anything past that into "Other". */
export function Bars({ data }: { data: BarDatum[] }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div className="bars">
      {data.slice(0, 5).map((d, i) => (
        <div className="bar-row" key={d.label}>
          <span className="bar-label">{d.label}</span>
          <div className="bar-track">
            <div
              className="bar-fill"
              style={{ width: `${Math.max(2, (d.value / max) * 100)}%`, background: SERIES_VARS[i] }}
            />
          </div>
          <span className="bar-value mono">{d.displayValue}</span>
        </div>
      ))}
    </div>
  );
}
