import { Routes, Route } from "react-router-dom";

// Mounted at /employee/* — nested employee routes (profile, attendance,
// time off) land here. See docs/dayflow-spec.md → Dashboard.
function EmployeeHome() {
  return (
    <div>
      <h1>Employee</h1>
    </div>
  );
}

export default function EmployeeApp() {
  return (
    <Routes>
      <Route index element={<EmployeeHome />} />
    </Routes>
  );
}
