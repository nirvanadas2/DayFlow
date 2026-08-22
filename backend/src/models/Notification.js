import mongoose from "mongoose";

const TYPES = ["leave_requested", "leave_approved", "leave_rejected", "employee_created"];

// One doc per in-app notification. Populated alongside the matching email —
// see services/notification.service.js and services/email.service.js. See
// docs/dayflow-spec.md → Future Enhancements.
const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    companyCode: {
      type: String,
      required: true,
      uppercase: true,
    },
    message: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: TYPES,
      required: true,
    },
    read: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

notificationSchema.index({ user: 1, createdAt: -1 });

const Notification = mongoose.model("Notification", notificationSchema);

export default Notification;
export { TYPES };
