import mongoose from "mongoose";
import bcrypt from "bcryptjs";

// Roles: "admin" covers Admin/HR (the spec treats Admin/HR as one permission tier).
const ROLES = ["admin", "employee"];

const userSchema = new mongoose.Schema(
  {
    // Auto-generated on creation, e.g. "01OBOJ20260001" — see utils/generateLoginId.js
    loginId: {
      type: String,
      required: true,
      unique: true,
    },
    companyName: {
      type: String,
      required: true,
      trim: true,
    },
    companyCode: {
      type: String,
      required: true,
      uppercase: true,
    },
    // Set at signup, propagated onto every employee created under this
    // company (same denormalization as companyName/companyCode). Data URL;
    // no file storage backend yet. See docs/dayflow-spec.md → Dashboard
    // ("Top nav: company logo…") and → Auth ("logo upload button").
    companyLogo: {
      type: String,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      select: false,
    },
    role: {
      type: String,
      enum: ROLES,
      default: "employee",
    },
    // True until the employee changes their system-generated first password.
    mustChangePassword: {
      type: Boolean,
      default: false,
    },
    // Placeholder for the employee grid's status dot until the real Attendance
    // model exists — see docs/dayflow-spec.md → Dashboard / Attendance.
    attendanceStatus: {
      type: String,
      enum: ["present", "leave", "absent"],
      default: "absent",
    },

    // Profile tab — see docs/dayflow-spec.md → Employee profile.
    photo: {
      type: String, // data URL; no file storage backend yet
    },
    title: {
      type: String,
      trim: true,
    },
    aboutMe: {
      type: String,
    },
    interests: {
      type: String,
    },

    // Private Info tab.
    bloodGroup: {
      type: String,
      trim: true,
    },
    address: {
      type: String,
    },
    emergencyContact: {
      type: String,
    },

    // Salary Info tab (admin-only) — see docs/dayflow-spec.md → Employee
    // profile → Salary Info. Component percentages live company-wide in
    // SalarySettings, not per-employee.
    wageType: {
      type: String,
      enum: ["monthly", "yearly"],
    },
    fixedWage: {
      type: Number,
    },
    workingDaysPerWeek: {
      type: Number,
    },

    // Time Off allocation — total days admin has granted this employee, set
    // via the Allocation sub-tab. "Available" is this minus approved usage,
    // computed on read in timeoff.controller.js. Unpaid Leave has no balance.
    // See docs/dayflow-spec.md → Time Off.
    paidLeaveBalance: {
      type: Number,
      default: 12,
    },
    sickLeaveBalance: {
      type: Number,
      default: 6,
    },
  },
  { timestamps: true }
);

userSchema.pre("save", async function hashPassword(next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.matchPassword = function matchPassword(enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model("User", userSchema);

export default User;
export { ROLES };
