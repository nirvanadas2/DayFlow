// Attendance and Time Off tabs need real data models that aren't built yet —
// see docs/dayflow-spec.md → Attendance / Time Off. This keeps the nav tabs
// navigable without building ahead of those phases.
export default function TabPlaceholder({ title }) {
  return (
    <div className="tab-placeholder">
      <h1>{title}</h1>
    </div>
  );
}
