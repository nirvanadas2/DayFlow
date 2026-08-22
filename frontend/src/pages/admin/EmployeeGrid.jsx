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

// "A grid of employee photo-cards" — see docs/dayflow-spec.md → Dashboard.
// Falls back to initials when no photo has been uploaded (mirrors the
// avatar fallback on EmployeeProfile's Profile tab).
function EmployeeCard({ employee, onClick }) {
  return (
    <button type="button" className="employee-card" onClick={onClick}>
      <span
        className="employee-card-dot"
        style={{ background: STATUS_COLORS[employee.attendanceStatus] }}
        title={STATUS_LABELS[employee.attendanceStatus]}
      />
      {employee.photo ? (
        <img src={employee.photo} alt="" className="employee-card-photo" />
      ) : (
        <span className="employee-card-avatar">{initials(employee.name)}</span>
      )}
      <span className="employee-card-name">{employee.name}</span>
    </button>
  );
}

function AddEmployeeCard({ onClick }) {
  return (
    <button type="button" className="employee-card employee-card--add" onClick={onClick}>
      <span className="employee-card-add-icon">+</span>
      <span className="employee-card-name">Add Employee</span>
    </button>
  );
}

// Only Admin/HR can create employee accounts — there's no open
// self-registration. Login ID and first password are both system-generated
// (see backend/src/controllers/auth.controller.js:createEmployee), so this
// form only collects the fields a person can't derive on their own. See
// docs/dayflow-spec.md → Auth.
function AddEmployeeModal({ onClose, onCreated }) {
  const { token } = useAuth();
  const [form, setForm] = useState({ name: "", email: "", phone: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [created, setCreated] = useState(null);

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const result = await api.createEmployee(form, token);
      setCreated(result);
      onCreated();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="timeoff-modal-overlay" onClick={onClose}>
      <div className="timeoff-modal" onClick={(e) => e.stopPropagation()}>
        {created ? (
          <>
            <h2>Employee Created</h2>
            <div className="auth-note">
              Share these sign-in details with {created.name} — the password won't be shown again.
            </div>
            <div className="profile-field">
              <span className="profile-field-label">Login ID</span>
              <span className="profile-field-value">{created.loginId}</span>
            </div>
            <div className="profile-field">
              <span className="profile-field-label">Temporary Password</span>
              <span className="profile-field-value">{created.temporaryPassword}</span>
            </div>
            <div className="profile-save-bar">
              <button type="button" className="profile-save-btn" onClick={onClose}>
                Done
              </button>
            </div>
          </>
        ) : (
          <form className="profile-tab-form" onSubmit={handleSubmit}>
            <h2>Add Employee</h2>
            <div className="profile-field">
              <label className="profile-field-label">Name</label>
              <input type="text" value={form.name} onChange={set("name")} required />
            </div>
            <div className="profile-field">
              <label className="profile-field-label">Email</label>
              <input type="email" value={form.email} onChange={set("email")} required />
            </div>
            <div className="profile-field">
              <label className="profile-field-label">Phone</label>
              <input type="tel" value={form.phone} onChange={set("phone")} />
            </div>

            {error && <div className="profile-save-error">{error}</div>}

            <div className="profile-save-bar">
              <button type="button" className="profile-cancel-btn" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="profile-save-btn" disabled={submitting}>
                {submitting ? "Creating…" : "Create Employee"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default function EmployeeGrid() {
  const { token, user: viewer } = useAuth();
  const navigate = useNavigate();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);

  function refresh() {
    return api
      .listEmployees(token)
      .then(setEmployees)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(refresh, [token]);

  if (loading) return null;
  if (error) return <div className="dashboard-error">{error}</div>;

  return (
    <div className="employee-grid">
      <AddEmployeeCard onClick={() => setShowAddModal(true)} />
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
      {showAddModal && (
        <AddEmployeeModal onClose={() => setShowAddModal(false)} onCreated={refresh} />
      )}
    </div>
  );
}
