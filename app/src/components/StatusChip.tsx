import type { ChipVariant } from "../lib/statusPresentation";

const VARIANT_CLASS: Record<ChipVariant, string> = {
  active: "chip-active",
  good: "chip-good",
  warning: "chip-warning",
  critical: "chip-critical",
  muted: "chip-muted",
};

export function StatusChip({ label, variant }: { label: string; variant: ChipVariant }) {
  return (
    <span className={`chip ${VARIANT_CLASS[variant]}`}>
      <span className="dot" />
      {label}
    </span>
  );
}
