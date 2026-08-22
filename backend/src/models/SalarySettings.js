import mongoose from "mongoose";

// One doc per company — every percentage the Salary Info tab needs to
// calculate salary components, admin-configurable rather than hardcoded. See
// docs/dayflow-spec.md → Employee profile → Salary Info.
const salarySettingsSchema = new mongoose.Schema(
  {
    companyCode: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
    },
    // Basic = basicPercent% of wage.
    basicPercent: {
      type: Number,
      default: 50,
    },
    // HRA = hraPercent% of Basic.
    hraPercent: {
      type: Number,
      default: 40,
    },
    // Standard Allowance = standardAllowancePercent% of wage.
    standardAllowancePercent: {
      type: Number,
      default: 0,
    },
    // Performance Bonus = performanceBonusPercent% of wage.
    performanceBonusPercent: {
      type: Number,
      default: 8.33,
    },
    // Leave Travel Allowance = leaveTravelAllowancePercent% of wage.
    leaveTravelAllowancePercent: {
      type: Number,
      default: 8.33,
    },
    // Provident Fund contribution = pfPercent% of Basic.
    pfPercent: {
      type: Number,
      default: 12,
    },
    // Professional Tax is a flat amount, not a percentage.
    professionalTax: {
      type: Number,
      default: 200,
    },
  },
  { timestamps: true }
);

const SalarySettings = mongoose.model("SalarySettings", salarySettingsSchema);

export default SalarySettings;
