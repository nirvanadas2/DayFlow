import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { api } from "../../lib/api.js";
import { STATUS_COLORS, STATUS_LABELS } from "../../lib/status.js";

function initials(name) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");
}

function EmployeeCard({ employee, onClick }) {
  return (
    <button type="button" className="employee-card" onClick={onClick}>
      <span
        className="employee-card-dot"
        style={{ background: STATUS_COLORS[employee.attendanceStatus] }}
        title={STATUS_LABELS[employee.attendanceStatus]}
      />
      <span className="employee-card-avatar">{initials(employee.name)}</span>
      <span className="employee-card-name">{employee.name}</span>
    </button>
  );
}

export default function EmployeeGrid() {
  const { token, user: viewer } = useAuth();
  const navigate = useNavigate();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .listEmployees(token)
      .then(setEmployees)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) return null;
  if (error) return <div className="dashboard-error">{error}</div>;

  return (
    <div className="employee-grid">
      {employees.map((employee) => (
        <EmployeeCard
          key={employee._id}
          // The signed-in user's own card reflects live check-in/out status
          // immediately, without waiting on a grid refetch — see
          // AuthContext's updateAttendanceStatus.
          employee={
            employee._id === viewer.id && viewer.attendanceStatus
              ? { ...employee, attendanceStatus: viewer.attendanceStatus }
              : employee
          }
          onClick={() => navigate(`/admin/employees/${employee._id}`)}
        />
      ))}
    </div>
  );
}
