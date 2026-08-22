import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login.jsx";
import AdminApp from "./pages/admin/AdminApp.jsx";
import EmployeeApp from "./pages/employee/EmployeeApp.jsx";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/admin/*" element={<AdminApp />} />
        <Route path="/employee/*" element={<EmployeeApp />} />
      </Routes>
    </BrowserRouter>
  );
}
