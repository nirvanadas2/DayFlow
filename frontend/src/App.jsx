import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext.jsx";
import Login from "./pages/Login.jsx";
import ForgotPassword from "./pages/ForgotPassword.jsx";
import ChangePassword from "./pages/ChangePassword.jsx";
import AdminApp from "./pages/admin/AdminApp.jsx";
import EmployeeApp from "./pages/employee/EmployeeApp.jsx";

// Guards /admin/* and /employee/*: bounces unauthenticated users to /login,
// and anyone with mustChangePassword still set to /change-password first.
function Gate({ children }) {
  const { token, user, loading } = useAuth();

  if (loading) return null;
  if (!token || !user) return <Navigate to="/login" replace />;
  if (user.mustChangePassword) return <Navigate to="/change-password" replace />;

  return children;
}

function HomeRedirect() {
  const { token, user, loading } = useAuth();

  if (loading) return null;
  if (!token || !user) return <Navigate to="/login" replace />;
  if (user.mustChangePassword) return <Navigate to="/change-password" replace />;

  return <Navigate to={user.role === "admin" ? "/admin" : "/employee"} replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomeRedirect />} />
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/change-password" element={<ChangePassword />} />
          <Route
            path="/admin/*"
            element={
              <Gate>
                <AdminApp />
              </Gate>
            }
          />
          <Route
            path="/employee/*"
            element={
              <Gate>
                <EmployeeApp />
              </Gate>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
