import User from "../models/User.js";

const PROFILE_FIELDS =
  "name email phone role loginId companyName attendanceStatus photo title aboutMe interests bloodGroup address emergencyContact wageType fixedWage workingDaysPerWeek paidLeaveBalance sickLeaveBalance";

// Fields an admin may edit via the Profile / Private Info / Salary Info tabs,
// plus the Time Off Allocation sub-tab (paid/sickLeaveBalance). Login
// credentials aren't part of this UI, so they're not included here.
// Component percentages (Basic %, HRA %, etc.) live company-wide in
// SalarySettings and go through /api/salary-settings instead.
const ADMIN_EDITABLE_FIELDS = [
  "photo",
  "name",
  "title",
  "aboutMe",
  "interests",
  "phone",
  "bloodGroup",
  "address",
  "emergencyContact",
  "wageType",
  "fixedWage",
  "workingDaysPerWeek",
  "paidLeaveBalance",
  "sickLeaveBalance",
];

// An employee editing their own profile: everything else on the Profile /
// Private Info tabs stays read-only — see docs/dayflow-spec.md → Employee
// profile.
const SELF_EDITABLE_FIELDS = ["photo", "phone", "address", "aboutMe", "interests"];

function canAccess(req, targetId) {
  return req.user.role === "admin" || String(req.user._id) === String(targetId);
}

// GET /api/employees (admin/HR only)
// Backs the dashboard employee grid and the Time Off Allocation sub-tab (the
// latter needs the leave balance fields too — safe to include since this
// endpoint is already admin-only). See docs/dayflow-spec.md → Dashboard.
export async function listEmployees(req, res) {
  const employees = await User.find({ companyCode: req.user.companyCode }).select(
    "name email role loginId attendanceStatus paidLeaveBalance sickLeaveBalance"
  );

  res.json(employees);
}

// GET /api/employees/:id
// Admin can view anyone in the company; an employee can only view themself.
export async function getEmployeeById(req, res) {
  if (!canAccess(req, req.params.id)) {
    return res.status(403).json({ message: "Forbidden" });
  }

  const employee = await User.findOne({
    _id: req.params.id,
    companyCode: req.user.companyCode,
  }).select(PROFILE_FIELDS);

  if (!employee) {
    return res.status(404).json({ message: "Employee not found" });
  }

  res.json(employee);
}

// PATCH /api/employees/:id
// Admin editing another employee (or themself): all Profile / Private Info
// fields editable. Employee editing their own profile: only photo, phone,
// address, about me, interests — everything else is dropped, not just hidden
// client-side.
export async function updateEmployeeById(req, res) {
  if (!canAccess(req, req.params.id)) {
    return res.status(403).json({ message: "Forbidden" });
  }

  const allowedFields = req.user.role === "admin" ? ADMIN_EDITABLE_FIELDS : SELF_EDITABLE_FIELDS;

  const update = {};
  for (const field of allowedFields) {
    if (field in req.body) update[field] = req.body[field];
  }

  if (Object.keys(update).length === 0) {
    return res.status(400).json({ message: "No editable fields provided" });
  }

  const employee = await User.findOneAndUpdate(
    { _id: req.params.id, companyCode: req.user.companyCode },
    update,
    { new: true, runValidators: true }
  ).select(PROFILE_FIELDS);

  if (!employee) {
    return res.status(404).json({ message: "Employee not found" });
  }

  res.json(employee);
}
