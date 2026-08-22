import User from "../models/User.js";
import Attendance from "../models/Attendance.js";

// Local calendar day as "YYYY-MM-DD" — see the identical helper in
// attendance.controller.js for why this isn't toISOString().
function toDateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function defaultTargetDate() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return toDateKey(d);
}

// Marks every employee with no attendance record for `date` ("YYYY-MM-DD",
// defaults to yesterday) as Absent. Meant to run once daily after the day
// has fully elapsed — see docs/dayflow-spec.md → Attendance: "A daily job
// that marks days with no record as Absent." Attendance records are the
// source of truth for payroll, so a missed check-in must turn into a real
// Absent record, not just a UI default.
export async function markAbsentees(date) {
  const targetDate = date || defaultTargetDate();

  const users = await User.find({}).select("_id companyCode");
  const existing = await Attendance.find({ date: targetDate }).select("employee");
  const existingIds = new Set(existing.map((r) => String(r.employee)));

  const absentees = users.filter((u) => !existingIds.has(String(u._id)));
  if (absentees.length === 0) return 0;

  await Attendance.insertMany(
    absentees.map((u) => ({
      employee: u._id,
      companyCode: u.companyCode,
      date: targetDate,
      status: "Absent",
    })),
    { ordered: false }
  );

  await User.updateMany(
    { _id: { $in: absentees.map((u) => u._id) } },
    { attendanceStatus: "absent" }
  );

  return absentees.length;
}
