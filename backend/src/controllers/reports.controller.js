import User from "../models/User.js";
import Attendance from "../models/Attendance.js";
import SalarySettings from "../models/SalarySettings.js";
import { calculateSalary } from "../utils/salaryCalc.js";

// Local calendar day as "YYYY-MM-DD" — same reasoning as
// attendance.controller.js's identical helper.
function toDateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

// month is 1-12 (calendar convention, matches attendance.controller.js).
function monthRange(month, year) {
  const start = `${year}-${String(month).padStart(2, "0")}-01`;
  const end = toDateKey(new Date(year, month, 0));
  return { start, end };
}

// GET /api/reports/attendance-summary?month=&year= (admin only)
// Present/absent/leave counts per employee for one month, current month by
// default — read-only, no editing from this screen. See
// docs/dayflow-spec.md → Future Enhancements.
export async function attendanceSummary(req, res) {
  const now = new Date();
  const month = Number(req.query.month) || now.getMonth() + 1;
  const year = Number(req.query.year) || now.getFullYear();
  const { start, end } = monthRange(month, year);

  const employees = await User.find({ companyCode: req.user.companyCode }).select("name loginId");
  const records = await Attendance.find({
    companyCode: req.user.companyCode,
    date: { $gte: start, $lte: end },
  }).select("employee status");

  const todayKey = toDateKey(now);
  const totalDays =
    todayKey >= start && todayKey <= end ? Number(todayKey.slice(8, 10)) : Number(end.slice(8, 10));

  const byEmployee = new Map();
  for (const record of records) {
    const key = String(record.employee);
    const bucket = byEmployee.get(key) || { present: 0, absent: 0, leave: 0 };
    if (record.status === "Present" || record.status === "Half-day") bucket.present += 1;
    else if (record.status === "Absent") bucket.absent += 1;
    else if (record.status === "Leave") bucket.leave += 1;
    byEmployee.set(key, bucket);
  }

  const rows = employees.map((employee) => {
    const bucket = byEmployee.get(String(employee._id)) || { present: 0, absent: 0, leave: 0 };
    return {
      employeeId: employee._id,
      name: employee.name,
      loginId: employee.loginId,
      presentDays: bucket.present,
      absentDays: bucket.absent,
      leaveDays: bucket.leave,
      totalDays,
      presentRate: totalDays > 0 ? +((bucket.present / totalDays) * 100).toFixed(1) : 0,
    };
  });

  res.json({ month, year, totalDays, employees: rows });
}

const PAYROLL_TOTAL_FIELDS = [
  "wage",
  "basic",
  "hra",
  "standardAllowance",
  "performanceBonus",
  "leaveTravelAllowance",
  "fixedAllowance",
  "pf",
  "professionalTax",
  "netPay",
];

// GET /api/reports/payroll-summary (admin only)
// Component breakdown + net pay per employee, using each employee's
// configured wage and the company's SalarySettings — the same source data
// the Salary Info tab uses, so this never fabricates numbers. Only employees
// with a wage configured are included. See docs/dayflow-spec.md → Employee
// profile → Salary Info and → Future Enhancements.
export async function payrollSummary(req, res) {
  const settings = (await SalarySettings.findOne({ companyCode: req.user.companyCode })) || {};

  const employees = await User.find({
    companyCode: req.user.companyCode,
    fixedWage: { $gt: 0 },
  }).select("name loginId wageType fixedWage");

  const rows = employees.map((employee) => {
    const calc = calculateSalary(employee.fixedWage, settings);
    const netPay = employee.fixedWage - calc.pf - calc.professionalTax;
    return {
      employeeId: employee._id,
      name: employee.name,
      loginId: employee.loginId,
      wageType: employee.wageType,
      wage: employee.fixedWage,
      ...calc,
      netPay,
    };
  });

  const totals = PAYROLL_TOTAL_FIELDS.reduce((acc, field) => {
    acc[field] = rows.reduce((sum, row) => sum + row[field], 0);
    return acc;
  }, {});

  res.json({ employees: rows, totals });
}
