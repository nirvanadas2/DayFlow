import { Routes, Route } from "react-router-dom";
import DashboardLayout from "../../components/DashboardLayout.jsx";
import EmployeeGrid from "./EmployeeGrid.jsx";
import EmployeeProfile from "../EmployeeProfile.jsx";
import Attendance from "../Attendance.jsx";
import TimeOff from "../TimeOff.jsx";

// Mounted at /admin/* — nested admin routes (employee grid, profile,
// attendance, time off) land here. See docs/dayflow-spec.md → Dashboard.
export default function AdminApp() {
  return (
    <Routes>
      <Route element={<DashboardLayout />}>
        <Route index element={<EmployeeGrid />} />
        <Route path="employees/:id" element={<EmployeeProfile />} />
        <Route path="attendance" element={<Attendance />} />
        <Route path="timeoff" element={<TimeOff />} />
      </Route>
    </Routes>
  );
}
