import TimeOff, { TYPES } from "../models/TimeOff.js";

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
    return res.status(404).json({ message: "Request not found" });
  }

  res.json(request);
}

// POST /api/timeoff/:id/approve (admin/HR only)
export function approve(req, res) {
  return setStatus(req, res, "Approved");
}

// POST /api/timeoff/:id/reject (admin/HR only)
export function reject(req, res) {
  return setStatus(req, res, "Rejected");
}
