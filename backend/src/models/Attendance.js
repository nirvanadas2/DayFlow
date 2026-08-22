import mongoose from "mongoose";

const STATUSES = ["Present", "Absent", "Half-day", "Leave"];

// One doc per employee per calendar day. See docs/dayflow-spec.md →
// Attendance.
const attendanceSchema = new mongoose.Schema(
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
    // "YYYY-MM-DD" — a plain string sidesteps timezone drift when comparing/
    // sorting by calendar day (a Date here would tie the record to a UTC
    // instant, not the day a person actually worked).
    date: {
      type: String,
      required: true,
    },
    checkIn: {
      type: Date,
    },
    checkOut: {
      type: Date,
    },
    workedHours: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: STATUSES,
      default: "Absent",
    },
  },
  { timestamps: true }
);

attendanceSchema.index({ employee: 1, date: 1 }, { unique: true });

const Attendance = mongoose.model("Attendance", attendanceSchema);

export default Attendance;
export { STATUSES };
