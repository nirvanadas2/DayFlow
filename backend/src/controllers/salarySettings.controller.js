import SalarySettings from "../models/SalarySettings.js";

// Percentages/amounts an admin may edit — everything on the model except the
// companyCode key itself.
const EDITABLE_FIELDS = [
  "basicPercent",
  "hraPercent",
  "standardAllowancePercent",
  "performanceBonusPercent",
  "leaveTravelAllowancePercent",
  "pfPercent",
  "professionalTax",
];

async function getOrCreateSettings(companyCode) {
  let settings = await SalarySettings.findOne({ companyCode });
  if (!settings) {
    settings = await SalarySettings.create({ companyCode });
  }
  return settings;
}

// GET /api/salary-settings (admin only)
// Company-wide, not tied to any one employee — lazily created with defaults
// on first read. See docs/dayflow-spec.md → Employee profile → Salary Info.
export async function getSalarySettings(req, res) {
  const settings = await getOrCreateSettings(req.user.companyCode);
  res.json(settings);
}

// PUT /api/salary-settings (admin only)
// Affects every employee in the company, not just the one currently being
// viewed in the UI.
export async function updateSalarySettings(req, res) {
  const settings = await getOrCreateSettings(req.user.companyCode);

  for (const field of EDITABLE_FIELDS) {
    if (field in req.body) settings[field] = req.body[field];
  }

  await settings.save();
  res.json(settings);
}
