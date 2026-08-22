import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { api } from "../lib/api.js";

// Route target for /admin/timeoff and /employee/timeoff. See
// docs/dayflow-spec.md → Time Off.

const TYPES = ["Paid Time Off", "Sick Leave", "Unpaid Leave"];
const MAX_ATTACHMENT_BYTES = 4 * 1024 * 1024;
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_FMT = new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" });

// Mirrors backend/src/controllers/attendance.controller.js's toDateKey —
// local calendar day, not toISOString() (which shifts the date for positive
// UTC offsets like IST).
function toDateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatDate(key) {
  if (!key) return "—";
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

// Only Pending/Approved are "requested/approved" per the spec — Rejected
// days aren't highlighted.
function requestForDay(dateKey, requests) {
  return requests.find(
    (r) => (r.status === "Pending" || r.status === "Approved") && dateKey >= r.startDate && dateKey <= r.endDate
  );
}

function StatusBadge({ status }) {
  return <span className={`timeoff-status timeoff-status--${status.toLowerCase()}`}>{status}</span>;
}

function BalanceCards({ balances }) {
  if (!balances) return null;
  return (
    <div className="timeoff-balance-cards">
      <div className="timeoff-balance-card">
        <span className="timeoff-balance-title">Paid Time Off</span>
        <span className="timeoff-balance-value">{balances.paid.available} days available</span>
      </div>
      <div className="timeoff-balance-card">
        <span className="timeoff-balance-title">Sick Time Off</span>
        <span className="timeoff-balance-value">{balances.sick.available} days available</span>
      </div>
    </div>
  );
}

function MonthCalendar({ cursor, requests, onPrev, onNext }) {
  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const startWeekday = new Date(year, month, 1).getDay();
  const totalDays = new Date(year, month + 1, 0).getDate();

  const cells = Array(startWeekday).fill(null);
  for (let day = 1; day <= totalDays; day++) cells.push(day);

  return (
    <div className="timeoff-calendar">
      <div className="timeoff-calendar-header">
        <button type="button" className="attendance-nav-arrow" onClick={onPrev} aria-label="Previous month">
          ‹
        </button>
        <span className="attendance-nav-label">{MONTH_FMT.format(cursor)}</span>
        <button type="button" className="attendance-nav-arrow" onClick={onNext} aria-label="Next month">
          ›
        </button>
      </div>
      <div className="timeoff-calendar-grid">
        {WEEKDAYS.map((w) => (
          <div key={w} className="timeoff-calendar-weekday">
            {w}
          </div>
        ))}
        {cells.map((day, i) => {
          if (day === null) return <div key={`blank-${i}`} className="timeoff-calendar-cell timeoff-calendar-cell--blank" />;
          const dateKey = toDateKey(new Date(year, month, day));
          const match = requestForDay(dateKey, requests);
          const modifier = match ? ` timeoff-calendar-cell--${match.status.toLowerCase()}` : "";
          return (
            <div
              key={dateKey}
              className={`timeoff-calendar-cell${modifier}`}
              title={match ? `${match.type} (${match.status})` : undefined}
            >
              {day}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function RequestModal({ userName, onClose, onSubmitted }) {
  const { token } = useAuth();
  const [form, setForm] = useState({ type: TYPES[0], startDate: "", endDate: "", allocation: "" });
  const [attachment, setAttachment] = useState("");
  const [attachmentName, setAttachmentName] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");
    if (file.size > MAX_ATTACHMENT_BYTES) {
      setError("Attachment must be under 4MB.");
      return;
    }
    setAttachmentName(file.name);
    const reader = new FileReader();
    reader.onload = () => setAttachment(reader.result);
    reader.readAsDataURL(file);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!form.startDate || !form.endDate || !form.allocation) {
      setError("Please fill in all fields.");
      return;
    }
    if (form.endDate < form.startDate) {
      setError("End date can't be before start date.");
      return;
    }
    if (form.type === "Sick Leave" && !attachment) {
      setError("Attachment is required for Sick Leave.");
      return;
    }

    setSubmitting(true);
    try {
      await api.requestTimeOff(
        {
          type: form.type,
          startDate: form.startDate,
          endDate: form.endDate,
          allocation: Number(form.allocation),
          attachment: attachment || undefined,
        },
        token
      );
      onSubmitted();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="timeoff-modal-overlay" onClick={onClose}>
      <div className="timeoff-modal" onClick={(e) => e.stopPropagation()}>
        <h2>New Time Off Request</h2>
        <form className="profile-tab-form" onSubmit={handleSubmit}>
          <div className="profile-field">
            <span className="profile-field-label">Employee</span>
            <span className="profile-field-value profile-field-readonly">{userName}</span>
          </div>

          <div className="profile-field">
            <label className="profile-field-label">Time Off Type</label>
            <select value={form.type} onChange={set("type")}>
              {TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div className="timeoff-modal-row">
            <div className="profile-field">
              <label className="profile-field-label">From</label>
              <input type="date" value={form.startDate} onChange={set("startDate")} required />
            </div>
            <div className="profile-field">
              <label className="profile-field-label">To</label>
              <input type="date" value={form.endDate} onChange={set("endDate")} required />
            </div>
          </div>

          <div className="profile-field">
            <label className="profile-field-label">Allocation (days)</label>
            <input type="number" min="0.5" step="0.5" value={form.allocation} onChange={set("allocation")} required />
          </div>

          {form.type === "Sick Leave" && (
            <div className="profile-field">
              <label className="profile-field-label">Attachment (required)</label>
              <label className="profile-photo-btn">
                {attachmentName || "Choose file"}
                <input type="file" hidden onChange={handleFile} />
              </label>
            </div>
          )}

          {error && <div className="profile-save-error">{error}</div>}

          <div className="profile-save-bar">
            <button type="button" className="profile-cancel-btn" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="profile-save-btn" disabled={submitting}>
              {submitting ? "Submitting…" : "Submit Request"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EmployeeTimeOff() {
  const { token, user } = useAuth();
  const [balances, setBalances] = useState(null);
  const [requests, setRequests] = useState([]);
  const [cursor, setCursor] = useState(() => new Date());
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState("");

  function refresh() {
    Promise.all([api.getTimeOffBalances(token), api.getMyTimeOff(token)])
      .then(([b, r]) => {
        setBalances(b);
        setRequests(r);
      })
      .catch((err) => setError(err.message));
  }

  useEffect(refresh, [token]);

  function shiftMonth(amount) {
    setCursor((c) => {
      const next = new Date(c);
      next.setMonth(next.getMonth() + amount);
      return next;
    });
  }

  return (
    <div className="timeoff-section">
      <div className="timeoff-header-row">
        <button type="button" className="profile-edit-btn" onClick={() => setShowModal(true)}>
          New
        </button>
      </div>

      {error && <div className="dashboard-error">{error}</div>}

      <BalanceCards balances={balances} />

      <MonthCalendar cursor={cursor} requests={requests} onPrev={() => shiftMonth(-1)} onNext={() => shiftMonth(1)} />

      {showModal && (
        <RequestModal
          userName={user.name}
          onClose={() => setShowModal(false)}
          onSubmitted={() => {
            setShowModal(false);
            refresh();
          }}
        />
      )}
    </div>
  );
}

function AdminTimeOffTab() {
  const { token } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actioningId, setActioningId] = useState("");

  function refresh() {
    setLoading(true);
    api
      .getAllTimeOff(token)
      .then(setRequests)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(refresh, [token]);

  async function handleDecision(id, decide) {
    setActioningId(id);
    setError("");
    try {
      const updated = decide === "approve" ? await api.approveTimeOff(id, token) : await api.rejectTimeOff(id, token);
      setRequests((prev) => prev.map((r) => (r._id === id ? updated : r)));
    } catch (err) {
      setError(err.message);
    } finally {
      setActioningId("");
    }
  }

  if (loading) return null;

  return (
    <div>
      {error && <div className="dashboard-error">{error}</div>}
      <div className="attendance-table-wrap">
        <table className="attendance-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Start Date</th>
              <th>End Date</th>
              <th>Type</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {requests.map((r) => (
              <tr key={r._id}>
                <td>{r.employee?.name}</td>
                <td>{formatDate(r.startDate)}</td>
                <td>{formatDate(r.endDate)}</td>
                <td>{r.type}</td>
                <td>
                  <StatusBadge status={r.status} />
                </td>
                <td>
                  {r.status === "Pending" && (
                    <div className="timeoff-actions">
                      <button
                        type="button"
                        className="timeoff-approve-btn"
                        disabled={actioningId === r._id}
                        onClick={() => handleDecision(r._id, "approve")}
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        className="timeoff-reject-btn"
                        disabled={actioningId === r._id}
                        onClick={() => handleDecision(r._id, "reject")}
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {requests.length === 0 && (
              <tr>
                <td colSpan={6} className="attendance-empty">
                  No time off requests yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AllocationRow({ employee, onSave }) {
  const [paid, setPaid] = useState(employee.paidLeaveBalance ?? 0);
  const [sick, setSick] = useState(employee.sickLeaveBalance ?? 0);
  const [saving, setSaving] = useState(false);

  const dirty = Number(paid) !== employee.paidLeaveBalance || Number(sick) !== employee.sickLeaveBalance;

  async function handleSave() {
    setSaving(true);
    try {
      await onSave(employee._id, { paidLeaveBalance: Number(paid), sickLeaveBalance: Number(sick) });
    } finally {
      setSaving(false);
    }
  }

  return (
    <tr>
      <td>{employee.name}</td>
      <td>
        <input
          type="number"
          min="0"
          step="0.5"
          value={paid}
          onChange={(e) => setPaid(e.target.value)}
          className="timeoff-allocation-input"
        />
      </td>
      <td>
        <input
          type="number"
          min="0"
          step="0.5"
          value={sick}
          onChange={(e) => setSick(e.target.value)}
          className="timeoff-allocation-input"
        />
      </td>
      <td>
        <button type="button" className="profile-save-btn" disabled={!dirty || saving} onClick={handleSave}>
          {saving ? "Saving…" : "Save"}
        </button>
      </td>
    </tr>
  );
}

function AdminAllocationTab() {
  const { token } = useAuth();
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

  async function handleSave(id, payload) {
    const updated = await api.updateEmployee(id, payload, token);
    setEmployees((prev) => prev.map((e) => (e._id === id ? { ...e, ...updated } : e)));
  }

  if (loading) return null;

  return (
    <div>
      {error && <div className="dashboard-error">{error}</div>}
      <div className="attendance-table-wrap">
        <table className="attendance-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Paid Time Off (days)</th>
              <th>Sick Leave (days)</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {employees.map((e) => (
              <AllocationRow key={e._id} employee={e} onSave={handleSave} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AdminTimeOff() {
  const [tab, setTab] = useState("timeoff");

  return (
    <div>
      <nav className="profile-tabs">
        <button type="button" className={tab === "timeoff" ? "active" : ""} onClick={() => setTab("timeoff")}>
          Time Off
        </button>
        <button type="button" className={tab === "allocation" ? "active" : ""} onClick={() => setTab("allocation")}>
          Allocation
        </button>
      </nav>
      <div className="profile-panel">{tab === "timeoff" ? <AdminTimeOffTab /> : <AdminAllocationTab />}</div>
    </div>
  );
}

export default function TimeOff() {
  const { user } = useAuth();

  return (
    <div className="timeoff-page">
      <h1 className="attendance-title">Time Off</h1>
      {user.role === "admin" ? <AdminTimeOff /> : <EmployeeTimeOff />}
    </div>
  );
}
