import TimeOff, { TYPES } from "../models/TimeOff.js";
import Attendance from "../models/Attendance.js";
import User from "../models/User.js";

// Local calendar day as "YYYY-MM-DD" — same reasoning as
// attendance.controller.js's identical helper: toISOString() converts to UTC
// first and would shift the date for positive UTC offsets (e.g. IST).
function toDateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function enumerateDateKeys(startKey, endKey) {
  const [sy, sm, sd] = startKey.split("-").map(Number);
  const [ey, em, ed] = endKey.split("-").map(Number);
  const cursor = new Date(sy, sm - 1, sd);
  const end = new Date(ey, em - 1, ed);
  const keys = [];
  while (cursor <= end) {
    keys.push(toDateKey(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return keys;
}

// Writes an Attendance "Leave" record for each day in an approved request's
// range, so the Attendance tab actually reflects it instead of showing a
// blank/Absent hole — see docs/dayflow-spec.md → Attendance and → Time Off.
// Skips any day the employee already checked in for, so approving a leave
// request never overwrites a real Present/Half-day record.
async function markLeaveDays(request) {
  const dateKeys = enumerateDateKeys(request.startDate, request.endDate);
  const todayKey = toDateKey(new Date());
  let coversToday = false;

  for (const date of dateKeys) {
    if (date === todayKey) coversToday = true;

    const existing = await Attendance.findOne({ employee: request.employee, date });
    if (existing) {
      if (!existing.checkIn) {
        existing.status = "Leave";
        await existing.save();
      }
    } else {
      await Attendance.create({
        employee: request.employee,
        companyCode: request.companyCode,
        date,
        status: "Leave",
      });
    }
  }

  if (coversToday) {
    const today = await Attendance.findOne({ employee: request.employee, date: todayKey });
    if (!today?.checkIn) {
      await User.findByIdAndUpdate(request.employee, { attendanceStatus: "leave" });
    }
  }
}

// GET /api/timeoff/me
// Self only — backs the employee's calendar highlighting. See
// docs/dayflow-spec.md → Time Off.
export async function listMine(req, res) {
  const requests = await TimeOff.find({ employee: req.user._id }).sort({ startDate: -1 });
  res.json(requests);
}

// GET /api/timeoff/balances
// Self only — "Paid Time Off — N days available" / "Sick Time Off — N days
// available" balance cards. Available = allocated minus days already used by
// Approved requests of that type. Unpaid Leave has no balance to track.
export async function balances(req, res) {
  const approved = await TimeOff.find({ employee: req.user._id, status: "Approved" });

  const usedPaid = approved
    .filter((r) => r.type === "Paid Time Off")
    .reduce((sum, r) => sum + r.allocation, 0);
  const usedSick = approved
    .filter((r) => r.type === "Sick Leave")
    .reduce((sum, r) => sum + r.allocation, 0);

  res.json({
    paid: {
      allocated: req.user.paidLeaveBalance,
      used: usedPaid,
      available: Math.max(0, req.user.paidLeaveBalance - usedPaid),
    },
    sick: {
      allocated: req.user.sickLeaveBalance,
      used: usedSick,
      available: Math.max(0, req.user.sickLeaveBalance - usedSick),
    },
  });
}

// POST /api/timeoff
// Always creates a request for the signed-in user — see
// docs/dayflow-spec.md → Time Off ("Employee" field in the request modal is
// the requester themself, not a picker; there's no admin-on-behalf-of flow).
export async function create(req, res) {
  const { type, startDate, endDate, allocation, attachment } = req.body;

  if (!TYPES.includes(type)) {
    return res.status(400).json({ message: "Invalid Time Off Type" });
  }
  if (!startDate || !endDate || !allocation) {
    return res.status(400).json({ message: "Missing required fields" });
  }
  if (type === "Sick Leave" && !attachment) {
    return res.status(400).json({ message: "Attachment is required for Sick Leave" });
  }

  const request = await TimeOff.create({
    employee: req.user._id,
    companyCode: req.user.companyCode,
    type,
    startDate,
    endDate,
    allocation,
    attachment,
  });

  res.status(201).json(request);
}

// GET /api/timeoff/admin (admin/HR only)
// Backs the "Time Off" sub-tab table — every request across the company.
export async function listAll(req, res) {
  const requests = await TimeOff.find({ companyCode: req.user.companyCode })
    .populate("employee", "name loginId")
    .sort({ createdAt: -1 });

  res.json(requests);
}

async function setStatus(req, res, status) {
  const request = await TimeOff.findOneAndUpdate(
    { _id: req.params.id, companyCode: req.user.companyCode },
    { status },
    { new: true }
  ).populate("employee", "name loginId");

  if (!request) {
    res.status(404).json({ message: "Request not found" });
    return null;
  }

  return request;
}

// POST /api/timeoff/:id/approve (admin/HR only)
export async function approve(req, res) {
  const request = await setStatus(req, res, "Approved");
  if (!request) return; // setStatus already sent the 404

  await markLeaveDays(request);
  res.json(request);
}

// POST /api/timeoff/:id/reject (admin/HR only)
export async function reject(req, res) {
  const request = await setStatus(req, res, "Rejected");
  if (!request) return;
  res.json(request);
}
