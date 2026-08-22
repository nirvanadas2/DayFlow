// Thin fetch wrapper around the Dayflow backend API.
// Base URL is configurable via VITE_API_URL (see .env.example); falls back to
// the local dev server default from backend/.env.example.
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

async function request(path, { method = "GET", body, token } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  let data = null;
  try {
    data = await res.json();
  } catch {
    // No JSON body (e.g. 204) — leave data as null.
  }

  if (!res.ok) {
    throw new Error(data?.message || `Request failed (${res.status})`);
  }

  return data;
}

// Matches backend/src/routes/auth.routes.js exactly.
export const api = {
  signup: (payload) => request("/auth/signup", { method: "POST", body: payload }),
  login: (payload) => request("/auth/login", { method: "POST", body: payload }),
  me: (token) => request("/auth/me", { token }),
  changePassword: (payload, token) =>
    request("/auth/change-password", { method: "POST", body: payload, token }),

  // Matches backend/src/routes/employees.routes.js.
  listEmployees: (token) => request("/employees", { token }),
  getEmployee: (id, token) => request(`/employees/${id}`, { token }),
  updateEmployee: (id, payload, token) =>
    request(`/employees/${id}`, { method: "PATCH", body: payload, token }),

  // Stubbed — backend/src/routes/attendance.routes.js has no endpoints yet.
  // Swap these for real request() calls once check-in/out routes exist.
  checkIn: () => new Promise((resolve) => setTimeout(() => resolve({ status: "present" }), 300)),
  checkOut: () => new Promise((resolve) => setTimeout(() => resolve({ status: "absent" }), 300)),
};
