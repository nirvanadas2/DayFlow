import { Routes, Route } from "react-router-dom";
import DashboardLayout from "../../components/DashboardLayout.jsx";
import EmployeeProfile from "../EmployeeProfile.jsx";
import Attendance from "../Attendance.jsx";
import TimeOff from "../TimeOff.jsx";
import TabPlaceholder from "../TabPlaceholder.jsx";

// Mounted at /employee/* — an employee's own dashboard. "My Profile" (from
// the topnav avatar menu) lands here at /employee/profile with no :id — the
// profile page resolves the viewer's own id. See docs/dayflow-spec.md →
// Dashboard.
export default function EmployeeApp() {
  return (
    <Routes>
      <Route element={<DashboardLayout />}>
        <Route index element={<TabPlaceholder title="Dashboard" />} />
        <Route path="profile" element={<EmployeeProfile />} />
        <Route path="attendance" element={<Attendance />} />
        <Route path="timeoff" element={<TimeOff />} />
      </Route>
    </Routes>
  );
}
