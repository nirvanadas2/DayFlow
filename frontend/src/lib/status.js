// Status dot color/label mapping — exact values from docs/dayflow-spec.md →
// Status colors (also defined as CSS custom properties in styles/tokens.css).
export const STATUS_COLORS = {
  present: "var(--color-status-present)",
  leave: "var(--color-status-leave)",
  absent: "var(--color-status-absent)",
};

export const STATUS_LABELS = {
  present: "Present",
  leave: "On Leave",
  absent: "Absent",
};
