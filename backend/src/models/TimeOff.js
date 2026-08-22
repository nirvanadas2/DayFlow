import mongoose from "mongoose";

const TYPES = ["Paid Time Off", "Sick Leave", "Unpaid Leave"];
const STATUSES = ["Pending", "Approved", "Rejected"];

// One doc per leave request. See docs/dayflow-spec.md → Time Off.
const timeOffSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    companyCode: {
      type: String,
      required: true,
      uppercase: true,
    },
    type: {
      type: String,
      enum: TYPES,
      required: true,
    },
    // "YYYY-MM-DD" strings — same reasoning as Attendance.date: sidesteps
    // timezone drift when comparing/sorting by calendar day.
    startDate: {
      type: String,
      required: true,
    },
    endDate: {
      type: String,
      required: true,
    },
    allocation: {
      type: Number,
      required: true,
      min: 0.5,
    },
    // Data URL; no file storage backend yet. Required only for Sick Leave —
    // e.g. a medical certificate.
    attachment: {
      type: String,
      required: function isAttachmentRequired() {
        return this.type === "Sick Leave";
      },
    },
    status: {
      type: String,
      enum: STATUSES,
      default: "Pending",
    },
  },
  { timestamps: true }
);

timeOffSchema.index({ employee: 1, startDate: 1 });

const TimeOff = mongoose.model("TimeOff", timeOffSchema);

export default TimeOff;
export { TYPES, STATUSES };
