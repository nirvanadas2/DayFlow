import Notification from "../models/Notification.js";

// Thin wrapper so every notify-on-event call site (auth.controller.js,
// timeoff.controller.js) reads the same way. See docs/dayflow-spec.md →
// Future Enhancements.
export async function notify({ userId, companyCode, message, type }) {
  return Notification.create({ user: userId, companyCode, message, type });
}
