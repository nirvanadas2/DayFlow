import { useEffect, useRef, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { api } from "../lib/api.js";
import "../styles/dashboard.css";

function initials(name) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");
}

function AvatarMenu() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function onClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <div className="topnav-avatar" ref={ref}>
      <button type="button" className="topnav-avatar-btn" onClick={() => setOpen((o) => !o)}>
        {initials(user.name)}
      </button>
      {open && (
        <div className="topnav-avatar-menu">
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              navigate(user.role === "admin" ? `/admin/employees/${user.id}` : "/employee/profile");
            }}
          >
            My Profile
          </button>
          <button type="button" onClick={handleLogout}>
            Log Out
          </button>
        </div>
      )}
    </div>
  );
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function CheckInOutButton() {
  const { token, updateAttendanceStatus } = useAuth();
  const [checkedIn, setCheckedIn] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const now = new Date();
    api
      .getMyAttendance({ month: now.getMonth() + 1, year: now.getFullYear() }, token)
      .then((records) => {
        const today = records.find((r) => r.date === todayKey());
        setCheckedIn(!!today?.checkIn && !today?.checkOut);
      })
      .catch(() => {
        // Non-fatal — button just falls back to "Check In".
      });
  }, [token]);

  async function handleClick() {
    setPending(true);
    setError("");
    try {
      if (checkedIn) {
        await api.checkOut(token);
        setCheckedIn(false);
      } else {
        await api.checkIn(token);
        setCheckedIn(true);
        updateAttendanceStatus("present");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="topnav-checkin-wrap">
      <button type="button" className="topnav-checkin" onClick={handleClick} disabled={pending}>
        {checkedIn ? "Check Out" : "Check In"}
      </button>
      {error && <span className="topnav-checkin-error">{error}</span>}
    </div>
  );
}

export default function DashboardLayout() {
  const { user } = useAuth();
  const base = user.role === "admin" ? "/admin" : "/employee";

  return (
    <div className="dashboard-shell">
      <header className="topnav">
        <div className="topnav-logo">
          {user.companyLogo ? (
            <img src={user.companyLogo} alt={user.companyName} className="topnav-logo-img" />
          ) : (
            user.companyName
          )}
        </div>
        <nav className="topnav-tabs">
          <NavLink to={base} end className={({ isActive }) => (isActive ? "active" : "")}>
            {user.role === "admin" ? "Employees" : "Dashboard"}
          </NavLink>
          <NavLink to={`${base}/attendance`} className={({ isActive }) => (isActive ? "active" : "")}>
            Attendance
          </NavLink>
          <NavLink to={`${base}/timeoff`} className={({ isActive }) => (isActive ? "active" : "")}>
            Time Off
          </NavLink>
        </nav>
        <div className="topnav-actions">
          <CheckInOutButton />
          <div className="topnav-bell" aria-label="Notifications">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M12 3a6 6 0 0 0-6 6v3.5c0 .6-.2 1.2-.6 1.7L4 16h16l-1.4-1.8a2.7 2.7 0 0 1-.6-1.7V9a6 6 0 0 0-6-6Z"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinejoin="round"
              />
              <path d="M9.5 19a2.5 2.5 0 0 0 5 0" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
            <span className="topnav-bell-dot" />
          </div>
          <AvatarMenu />
        </div>
      </header>
      <main className="dashboard-content">
        <Outlet />
      </main>
    </div>
  );
}
