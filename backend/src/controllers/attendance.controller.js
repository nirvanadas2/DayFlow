import Attendance from "../models/Attendance.js";
import User from "../models/User.js";

// A day beyond this many worked hours counts toward "Extra Hours"; below
// this on checkout it's a Half-day rather than Present. See
// docs/dayflow-spec.md → Attendance.
const STANDARD_HOURS = 8;
const HALF_DAY_HOURS = 4;

// Local calendar day as "YYYY-MM-DD". Deliberately not toISOString() —
// that converts to UTC first, which shifts the date for any positive UTC
// offset (e.g. IST) and would silently misfile check-ins near midnight.
function toDateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

// month is 1-12 (calendar convention, matches the query params the frontend sends).
function monthRange(month, year) {
  const start = `${year}-${String(month).padStart(2, "0")}-01`;
  const end = toDateKey(new Date(year, month, 0));
  return { start, end };
}

function withExtraHours(record) {
  const obj = record.toObject ? record.toObject() : record;
  const extraHours = obj.workedHours > STANDARD_HOURS ? +(obj.workedHours - STANDARD_HOURS).toFixed(2) : 0;
  return { ...obj, extraHours };
}

// POST /api/attendance/check-in
export async function checkIn(req, res) {
  const now = new Date();
  const date = toDateKey(now);

  let record = await Attendance.findOne({ employee: req.user._id, date });
  if (record && record.checkIn) {
    return res.status(400).json({ message: "Already checked in for today" });
  }

  if (!record) {
    record = new Attendance({
      employee: req.user._id,
      companyCode: req.user.companyCode,
      date,
    });
  }

  record.checkIn = now;
  record.status = "Present";
  await record.save();

  await User.findByIdAndUpdate(req.user._id, { attendanceStatus: "present" });

  res.json(withExtraHours(record));
}

// POST /api/attendance/check-out
export async function checkOut(req, res) {
  const now = new Date();
  const date = toDateKey(now);

  const record = await Attendance.findOne({ employee: req.user._id, date });
  if (!record || !record.checkIn) {
    return res.status(400).json({ message: "Check in before checking out" });
  }
  if (record.checkOut) {
    return res.status(400).json({ message: "Already checked out for today" });
  }

  record.checkOut = now;
  const hours = (record.checkOut - record.checkIn) / (1000 * 60 * 60);
  record.workedHours = +hours.toFixed(2);
  record.status = record.workedHours < HALF_DAY_HOURS ? "Half-day" : "Present";
  await record.save();

  res.json(withExtraHours(record));
}

// GET /api/attendance/me?month=&year=
// Self only — the employee's own day-wise table for one month, current
// month by default. See docs/dayflow-spec.md → Attendance.
export async function listMine(req, res) {
  const now = new Date();
  const month = Number(req.query.month) || now.getMonth() + 1;
  const year = Number(req.query.year) || now.getFullYear();
  const { start, end } = monthRange(month, year);

  const records = await Attendance.find({
    employee: req.user._id,
    date: { $gte: start, $lte: end },
  }).sort({ date: 1 });

  res.json(records.map(withExtraHours));
}

// GET /api/attendance/admin?employeeId=&month=&year= (admin/HR only)
// Same table shape as listMine but for any employee in the company, plus
// header stats. See docs/dayflow-spec.md → Attendance.
export async function listForEmployee(req, res) {
  const { employeeId } = req.query;
  if (!employeeId) {
    return res.status(400).json({ message: "employeeId is required" });
  }

  const employee = await User.findOne({
    _id: employeeId,
    companyCode: req.user.companyCode,
  }).select("name loginId attendanceStatus");
  if (!employee) {
    return res.status(404).json({ message: "Employee not found" });
  }

  const now = new Date();
  const month = Number(req.query.month) || now.getMonth() + 1;
  const year = Number(req.query.year) || now.getFullYear();
  const { start, end } = monthRange(month, year);

  const records = await Attendance.find({
    employee: employeeId,
    date: { $gte: start, $lte: end },
  }).sort({ date: 1 });

  const presentDays = records.filter((r) => r.status === "Present" || r.status === "Half-day").length;
  const todayKey = toDateKey(now);
  const totalWorkingDays =
    todayKey >= start && todayKey <= end ? Number(todayKey.slice(8, 10)) : Number(end.slice(8, 10));

  res.json({
    employee,
    records: records.map(withExtraHours),
    stats: { presentDays, totalWorkingDays },
  });
}
