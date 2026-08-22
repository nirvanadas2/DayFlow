import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
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

// Read-only placeholder — Profile / Private Info / Salary Info tabs land here
// in Phase 3. See docs/dayflow-spec.md → Employee profile.
export default function EmployeeProfile() {
  const { id } = useParams();
  const { token } = useAuth();
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    api
      .getEmployee(id, token)
      .then(setEmployee)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id, token]);

  if (loading) return null;
  if (error) return <div className="dashboard-error">{error}</div>;
  if (!employee) return null;

  return (
    <div className="profile-page">
      <Link to="/admin" className="profile-back-link">
        ← Back to Employees
      </Link>
      <div className="profile-card">
        <span
          className="profile-avatar"
          style={{ boxShadow: `0 0 0 3px ${STATUS_COLORS[employee.attendanceStatus]}` }}
        >
          {initials(employee.name)}
        </span>
        <h1>{employee.name}</h1>
        <div className="profile-status">{STATUS_LABELS[employee.attendanceStatus]}</div>
        <dl className="profile-fields">
          <dt>Login ID</dt>
          <dd>{employee.loginId}</dd>
          <dt>Email</dt>
          <dd>{employee.email}</dd>
          <dt>Role</dt>
          <dd>{employee.role}</dd>
        </dl>
        <div className="profile-note">Profile tabs (Profile, Private Info, Salary Info) come in Phase 3.</div>
      </div>
    </div>
  );
}
