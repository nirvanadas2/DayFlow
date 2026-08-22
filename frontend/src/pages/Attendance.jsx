import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { api } from "../lib/api.js";

// Route target for /admin/attendance and /employee/attendance — same
// day-wise table shape for both, the admin view adds an employee picker and
// header stats. See docs/dayflow-spec.md → Attendance.

const WEEKDAY_FMT = new Intl.DateTimeFormat("en-US", { weekday: "short" });
const MONTH_FMT = new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" });
const DAY_FMT = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" });

// Local calendar day as "YYYY-MM-DD" — not toISOString(), which converts to
// UTC first and would shift the date for positive UTC offsets (e.g. IST).
// Mirrors backend/src/controllers/attendance.controller.js exactly.
function toDateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function daysInMonth(year, month) {
  return new Date(year, month, 0).getDate();
}

function formatTime(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
}

function formatHours(hours) {
  if (!hours) return "—";
  return `${Number(hours).toFixed(2)}h`;
}

// Builds one row per calendar day in the month, filling gaps (days with no
// attendance record) with a display-only Absent fallback for past days —
// the actual persisted Absent record is written by the daily job once it
// runs; this just keeps the table from showing a blank hole in the meantime.
function buildRows(year, month, records) {
  const byDate = new Map(records.map((r) => [r.date, r]));
  const today = startOfDay(new Date());
  const total = daysInMonth(year, month);
  const rows = [];

  for (let day = 1; day <= total; day++) {
    const dateObj = new Date(year, month - 1, day);
    const key = toDateKey(dateObj);
    const record = byDate.get(key);
    rows.push({
      date: key,
      dateObj,
      checkIn: record?.checkIn || null,
      checkOut: record?.checkOut || null,
      workedHours: record?.workedHours || 0,
      extraHours: record?.extraHours || 0,
      status: record?.status || (dateObj < today ? "Absent" : null),
    });
  }

  return rows;
}

function AttendanceTable({ rows }) {
  if (rows.length === 0) {
    return <div className="attendance-empty">No attendance records for this day.</div>;
  }

  return (
    <div className="attendance-table-wrap">
      <table className="attendance-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Check In</th>
            <th>Check Out</th>
            <th>Work Hours</th>
            <th>Extra Hours</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.date} className={row.status === "Absent" ? "attendance-row-absent" : ""}>
              <td>
                {WEEKDAY_FMT.format(row.dateObj)}, {DAY_FMT.format(row.dateObj)}
              </td>
              <td>{formatTime(row.checkIn)}</td>
              <td>{formatTime(row.checkOut)}</td>
              <td>{formatHours(row.workedHours)}</td>
              <td>{formatHours(row.extraHours)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function AttendanceNav({ viewMode, onViewModeChange, label, onPrev, onNext, nextDisabled }) {
  return (
    <div className="attendance-nav">
      <div className="attendance-nav-arrows">
        <button type="button" className="attendance-nav-arrow" onClick={onPrev} aria-label="Previous">
          ‹
        </button>
        <span className="attendance-nav-label">{label}</span>
        <button
          type="button"
          className="attendance-nav-arrow"
          onClick={onNext}
          disabled={nextDisabled}
          aria-label="Next"
        >
          ›
        </button>
      </div>
      <div className="attendance-view-toggle">
        <button
          type="button"
          className={viewMode === "date" ? "active" : ""}
          onClick={() => onViewModeChange("date")}
        >
          Date
        </button>
        <button
          type="button"
          className={viewMode === "day" ? "active" : ""}
          onClick={() => onViewModeChange("day")}
        >
          Day
        </button>
      </div>
    </div>
  );
}

// mode: "mine" (self, no stats) or "admin" (a chosen employeeId, with stats).
function AttendanceView({ mode, employeeId, token }) {
  const [viewMode, setViewMode] = useState("date");
  const [cursor, setCursor] = useState(() => new Date());
  const [records, setRecords] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const year = cursor.getFullYear();
  const month = cursor.getMonth() + 1;

  useEffect(() => {
    if (mode === "admin" && !employeeId) {
      setRecords([]);
      setStats(null);
      setLoading(false);
      return undefined;
    }

    let cancelled = false;
    setLoading(true);
    setError("");

    const request =
      mode === "admin"
        ? api.getEmployeeAttendance({ employeeId, month, year }, token)
        : api.getMyAttendance({ month, year }, token).then((recs) => ({ records: recs, stats: null }));

    request
      .then((page) => {
        if (cancelled) return;
        setRecords(page.records);
        setStats(page.stats);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [mode, employeeId, token, month, year]);

  const rows = useMemo(() => buildRows(year, month, records), [year, month, records]);
  const displayRows = viewMode === "day" ? rows.filter((r) => r.date === toDateKey(cursor)) : rows;

  const today = new Date();
  const isCurrentMonth = year === today.getFullYear() && month === today.getMonth() + 1;
  const isToday = toDateKey(cursor) === toDateKey(today);

  function shift(amount) {
    setCursor((c) => {
      const next = new Date(c);
      if (viewMode === "date") next.setMonth(next.getMonth() + amount);
      else next.setDate(next.getDate() + amount);
      return next;
    });
  }

  const label = viewMode === "date" ? MONTH_FMT.format(cursor) : `${WEEKDAY_FMT.format(cursor)}, ${DAY_FMT.format(cursor)}`;
  const nextDisabled = viewMode === "date" ? isCurrentMonth : isToday;

  return (
    <div className="attendance-view">
      {mode === "admin" && stats && (
        <div className="attendance-stats">
          <div className="attendance-stat-box">
            <span className="attendance-stat-value">{stats.presentDays}</span>
            <span className="attendance-stat-label">Days Present</span>
          </div>
          <div className="attendance-stat-box">
            <span className="attendance-stat-value">{stats.totalWorkingDays}</span>
            <span className="attendance-stat-label">Total Working Days</span>
          </div>
        </div>
      )}

      <AttendanceNav
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        label={label}
        onPrev={() => shift(-1)}
        onNext={() => shift(1)}
        nextDisabled={nextDisabled}
      />

      {loading && <div className="profile-field-value profile-field-readonly">Loading…</div>}
      {error && <div className="dashboard-error">{error}</div>}
      {!loading && !error && <AttendanceTable rows={displayRows} />}
    </div>
  );
}

function EmployeePicker({ employees, selectedId, onSelect }) {
  const [search, setSearch] = useState("");
  const filtered = employees.filter((e) =>
    `${e.name} ${e.loginId}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="attendance-picker">
      <input
        type="search"
        className="attendance-picker-search"
        placeholder="Search employee…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      <div className="attendance-picker-list">
        {filtered.map((employee) => (
          <button
            key={employee._id}
            type="button"
            className={employee._id === selectedId ? "active" : ""}
            onClick={() => onSelect(employee._id)}
          >
            <span>{employee.name}</span>
            <span className="attendance-picker-loginid">{employee.loginId}</span>
          </button>
        ))}
        {filtered.length === 0 && <div className="attendance-picker-empty">No matches.</div>}
      </div>
    </div>
  );
}

function AdminAttendance() {
  const { token } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    api
      .listEmployees(token)
      .then((list) => {
        setEmployees(list);
        setSelectedId((prev) => prev || list[0]?._id || "");
      })
      .catch((err) => setLoadError(err.message));
  }, [token]);

  return (
    <div className="attendance-admin-layout">
      <EmployeePicker employees={employees} selectedId={selectedId} onSelect={setSelectedId} />
      <div className="attendance-admin-main">
        {loadError && <div className="dashboard-error">{loadError}</div>}
        {selectedId ? (
          <AttendanceView mode="admin" employeeId={selectedId} token={token} />
        ) : (
          <div className="attendance-picker-empty">Select an employee to view attendance.</div>
        )}
      </div>
    </div>
  );
}

export default function Attendance() {
  const { user, token } = useAuth();

  return (
    <div className="attendance-page">
      <h1 className="attendance-title">Attendance</h1>
      {user.role === "admin" ? <AdminAttendance /> : <AttendanceView mode="mine" token={token} />}
    </div>
  );
}
