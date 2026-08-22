# Dayflow HRMS — structural spec (from wireframe + PRD)

## Status colors (exact values — these are functional, not decorative)
- Present / checked in: `#22C55E` (green)
- On leave: `#F97316` (orange)
- Absent / no check-in: `#EAB308` (yellow)
- Notification indicator: `#EF4444` (red)

## Auth
- Single centered card, Sign In / Sign Up toggle (not a marketing hero layout).
- Sign In: Login ID/Email field, Password field, "Sign In" button, "Don't have an account? Sign Up" link.
- Sign Up: Company Name field + logo upload button, Name, Email, Phone, Password, Confirm Password,
  "Sign Up" button, "Already have an account? Sign In" link.
- Only Admin/HR can create new employee accounts — there's no open self-registration for employees.
- Login ID auto-generated on creation, format: [2-letter company code][first 2 letters of first+last
  name][4-digit join year][4-digit serial number], e.g. `01OBOJ20260001`.
- First password is system-generated; employee logs in and can change it.

## Dashboard (post-login)
- Top nav: company logo, Employees / Attendance / Time Off tabs, notification bell (red dot), avatar.
- Avatar click → dropdown: My Profile, Log Out.
- Admin lands on a grid of employee photo-cards. Each card: avatar, name, small status dot top-right
  (see Status colors above).
- Clicking a card opens that employee's profile in read-only (non-editable) mode.
- Check In / Check Out button on the dashboard — on successful check-in, that employee's status dot
  turns green in real time.

## Employee profile — 3 tabs
- **Profile**: photo, name, title, free-text "about me" and "interests/hobbies" fields.
- **Private Info**: phone, blood group, address, emergency contact, personal details.
- **Salary Info**: admin-only tab, hidden entirely for employees viewing their own profile.
  - Fields: Wage Type, Fixed Wage (monthly/yearly), No. of working days/week.
  - Salary components, auto-calculated off wage: Basic, HRA, Standard Allowance, Performance Bonus,
    Leave Travel Allowance, Fixed Allowance.
  - Example formula: Basic = 50% of wage; HRA = 40% of Basic; Performance Bonus = 8.33%; Leave Travel
    Allowance = 8.33%; Fixed Allowance = wage minus sum of everything else.
  - Every percentage must be admin-configurable, not hardcoded.
  - Sum of all components must never exceed the defined wage — validate this.
  - Separate boxes for Provident Fund (PF) contribution (e.g. 12%, configurable) and Professional Tax
    (flat amount, configurable, e.g. ₹200).

## Attendance
- If an employee's working hours are attendance-based, their pay depends on it — this ties directly
  into payroll.
- Employee view: day-wise attendance table for the current month by default (own records only),
  columns: Date, Check In, Check Out, Work Hours, Extra Hours. Date navigation arrows + a Date/Day
  view toggle.
- Admin/HR view: same table, scoped to all employees, with a search/employee picker. Header stats:
  count of days present, total working days.
- Attendance records are the source of truth for payroll: unpaid leave or missing attendance
  automatically reduces the number of payable days when payroll is computed.

## Time Off
- Leave types: Paid Time Off, Sick Leave, Unpaid Leave.
- Employee view: two balance cards — "Paid Time Off — N days available" and "Sick Time Off — N days
  available" — plus a month calendar highlighting requested/approved days. A "New" button opens a
  request modal.
- Request modal fields: Employee, Time Off Type, Validity Period (From/To), Allocation (days),
  Attachment (required when type = Sick Leave, e.g. a medical certificate).
- Admin/HR view: two sub-tabs — "Time Off" (table: Name, Start Date, End Date, Type, Status, with
  Approve/Reject buttons) and "Allocation" (set each employee's Paid/Sick day balances).
- Employees can only see their own time-off records; Admin/HR can see and approve/reject everyone's.

## Out of scope for v1 (per PRD "Future Enhancements")
Email/notification alerts and an analytics/reports dashboard are explicitly future work — don't
build them until the above is solid.
