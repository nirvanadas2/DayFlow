import Notification from "../models/Notification.js";

// GET /api/notifications
// Self only — backs the topnav bell dropdown. Most recent first, capped so
// the dropdown never has to render an unbounded list.
export async function listMine(req, res) {
  const notifications = await Notification.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(50);
  res.json(notifications);
}

// POST /api/notifications/read-all
// Self only — called when the bell dropdown is opened, so the red dot clears
// once the employee has actually seen their unread notifications. See
// docs/dayflow-spec.md → Future Enhancements.
export async function markAllRead(req, res) {
  await Notification.updateMany({ user: req.user._id, read: false }, { read: true });
  res.json({ message: "Marked as read" });
}
