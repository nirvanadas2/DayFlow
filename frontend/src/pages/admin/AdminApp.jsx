import { Routes, Route } from "react-router-dom";

// Mounted at /admin/* — nested admin routes (employee grid, profile,
// attendance, time off) land here. See docs/dayflow-spec.md → Dashboard.
function AdminHome() {
  return (
    <div>
      <h1>Admin</h1>
    </div>
  );
}

export default function AdminApp() {
  return (
    <Routes>
      <Route index element={<AdminHome />} />
    </Routes>
  );
}
