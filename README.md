# Dayflow

### Human Resource Management System

Every workday, perfectly aligned.

## Overview

Dayflow is an HRMS built to digitize core HR operations — onboarding, profile management,
attendance, leave/time-off, and payroll — for a small company's Admin/HR team and its employees, in
one role-based platform.

- **Employees** manage their own profile (limited fields), check in/out, request time off, and view
  their attendance — read-only where it matters (salary, most profile fields).
- **Admin/HR** manage the whole workforce: create employee accounts, view/edit every profile,
  approve or reject leave, configure salary structure, and read company-wide reports.

There is no open self-registration. An Admin/HR account is created via Sign Up (which also creates
the company); every employee account after that is created by an admin from the dashboard.

## Tech Stack

- **Frontend**: React 19 + Vite, React Router, plain CSS against a small design-token system
  (`frontend/src/styles/tokens.css`) — no UI framework.
- **Backend**: Express + Mongoose (MongoDB), JWT auth, `node-cron` for a daily job, `nodemailer` for
  optional email alerts.

## Project Structure

```
backend/
  src/
    models/        Mongoose schemas (User, Attendance, TimeOff, SalarySettings, Notification)
    controllers/    Route handlers, one file per resource
    routes/         Express routers, mounted under /api in routes/index.js
    middleware/     protect (JWT) / roleCheck (role gate)
    services/       email.service.js, notification.service.js
    jobs/           markAbsentees.js — daily cron, see below
    utils/          login ID / temp password generation, salary math
frontend/
  src/
    pages/          Route-level screens; admin/ and employee/ hold each role's app shell
    components/     DashboardLayout (shared top nav, used by both role apps)
    context/        AuthContext — token/user state, persisted to localStorage
    lib/            api.js (fetch wrapper matching the backend routes 1:1), status/salary helpers
    styles/         tokens.css (colors/spacing/radius), auth.css, dashboard.css
docs/
  dayflow-spec.md   Structural spec the build follows (wireframe + PRD notes)
```

## Getting Started

Requires Node.js and a running MongoDB instance (local or a connection string like Atlas).

**Backend**

```
cd backend
npm install
cp .env.example .env   # fill in MONGO_URI and JWT_SECRET at minimum
npm run dev             # http://localhost:5000
```

**Frontend**

```
cd frontend
npm install
cp .env.example .env   # only needed if the API isn't at the default below
npm run dev             # http://localhost:5173
```

First use: open the frontend, use **Sign Up** to create a company + Admin/HR account, then use the
admin dashboard's **Add Employee** card to create employee accounts (each gets an auto-generated
Login ID and a system-generated first password, shown once at creation time).

## Features

### Authentication

- Sign Up creates a company and its first Admin/HR account (company name, optional logo, name,
  email, phone, password).
- Sign In accepts either the auto-generated Login ID or email.
- Login ID format: `[2-char company code][2 letters of first name + 2 of last name][4-digit join
  year][4-digit serial]`, e.g. `01OBOJ20260001`.
- New employee accounts (Admin/HR only, no self-registration) get a system-generated temporary
  password and are forced through a **Change Password** screen on first login.
- Forgot Password screen is currently a stub.

### Dashboard

- Shared top nav (company logo, Employees/Attendance/Time Off tabs, notification bell, avatar menu)
  used by both the admin and employee app shells, adapting its links/labels by role.
- Admin lands on a grid of employee photo-cards, each with a live attendance-status dot
  (present/leave/absent) and an **Add Employee** card.
- Check In / Check Out button updates that employee's status dot in real time.

### Employee Profile (3 tabs: Profile, Private Info, Salary Info)

- Opens **read-only by default** for an admin (own or another employee's profile) — an **Edit**
  button unlocks the form; **Cancel** discards changes without saving.
- An employee viewing their own profile always sees the editable form directly (no toggle), but can
  only edit photo, phone, address, about me, and interests/hobbies — every other field is read-only,
  enforced both in the UI and on the backend.
- **Salary Info** is admin-only and completely absent (not just disabled) from an employee's view of
  their own profile.

### Attendance

- Day-wise table (Date, Check In, Check Out, Work Hours, Extra Hours) with Date/Day view toggle and
  month navigation.
- Employees see only their own records; Admin/HR get an employee picker plus header stats (days
  present / total working days).
- A daily cron job (`markAbsentees`, scheduled just after midnight) marks any employee with no
  attendance record for the previous day as Absent, so payroll always has a real record to read
  instead of an inferred gap.

### Time Off

- Types: Paid Time Off, Sick Leave, Unpaid Leave. Statuses: Pending, Approved, Rejected.
- Employee view: two balance cards ("Paid/Sick Time Off — N days available"), a month calendar
  highlighting requested/approved days, and a **New** request modal (Attachment required only for
  Sick Leave).
- Admin view: **Time Off** sub-tab (table with Approve/Reject) and **Allocation** sub-tab (set each
  employee's Paid/Sick day balances).
- Approving a request writes matching "Leave" days into that employee's Attendance records, so
  Attendance and Time Off stay consistent instead of showing contradictory data.
- Employees see only their own requests; Admin/HR see and decide on everyone's.

### Salary

- Company-wide, admin-configurable percentages (Basic, HRA, Standard Allowance, Performance Bonus,
  Leave Travel Allowance, PF, Professional Tax) drive a live salary breakdown per employee, with
  validation that components never exceed the defined wage.
- A read-only Salary Slip view renders the computed breakdown.

### Notifications & Email

- In-app notification bell (self-service, own notifications only) fires on events like a new leave
  request or an approve/reject decision.
- The same events optionally send an email via SMTP; if `SMTP_HOST` isn't set, sending is skipped
  and logged to the console instead of failing — no SMTP server is required for local development.

### Reports (Admin only)

- Attendance summary and payroll summary views, aggregated read-only from Attendance/SalarySettings/
  User — no separate reporting data store.

## Roles & Permissions

| | Admin / HR | Employee |
|---|---|---|
| Create employee accounts | Yes | No |
| View any employee's profile | Yes | Own only |
| Edit profile fields | All (behind Edit toggle) | Photo, phone, address, about me, interests — own profile only |
| Salary Info tab | Visible | Hidden entirely |
| Attendance | Everyone's, with picker + stats | Own only |
| Time Off | Approve/reject everyone's, set allocations | Request and view own only |
| Reports | Yes | No |

Every role check exists on the backend (`protect` + `roleCheck` middleware, plus ownership checks in
controllers), not just in the UI.

## Environment Variables

**`backend/.env`**

| Variable | Purpose |
|---|---|
| `PORT` | API port (default 5000) |
| `MONGO_URI` | MongoDB connection string |
| `JWT_SECRET` / `JWT_EXPIRES_IN` | JWT signing |
| `CLIENT_ORIGIN` | Allowed CORS origin (the frontend's URL) |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` / `SMTP_FROM` | Optional — email alerts. Leave `SMTP_HOST` unset to skip sending in dev. |

**`frontend/.env`**

| Variable | Purpose |
|---|---|
| `VITE_API_URL` | Backend API base URL (default `http://localhost:5000/api`) |

## Design Reference

UI/UX wireframes and flow: https://app.excalidraw.com/l/65VNwvy7c4X/58RLEJ4oOwh

The structural spec derived from that wireframe + the PRD lives at `docs/dayflow-spec.md` and is the
source of truth the implementation follows.
