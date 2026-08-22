// Mirrors frontend/src/lib/salary.js's calculateSalary exactly — see
// docs/dayflow-spec.md → Employee profile → Salary Info. Duplicated
// server-side (rather than shared) because the payroll report in
// reports.controller.js needs to aggregate components across every employee
// server-side; frontend/src/lib/salary.js already documents that it mirrors
// backend/src/models/SalarySettings.js in the same way.
export function calculateSalary(wage, settings) {
  const w = Number(wage) || 0;

  const basic = w * ((Number(settings.basicPercent) || 0) / 100);
  const hra = basic * ((Number(settings.hraPercent) || 0) / 100);
  const standardAllowance = w * ((Number(settings.standardAllowancePercent) || 0) / 100);
  const performanceBonus = w * ((Number(settings.performanceBonusPercent) || 0) / 100);
  const leaveTravelAllowance = w * ((Number(settings.leaveTravelAllowancePercent) || 0) / 100);

  const componentTotal = basic + hra + standardAllowance + performanceBonus + leaveTravelAllowance;
  const fixedAllowance = w - componentTotal;

  const pf = basic * ((Number(settings.pfPercent) || 0) / 100);
  const professionalTax = Number(settings.professionalTax) || 0;

  return { basic, hra, standardAllowance, performanceBonus, leaveTravelAllowance, fixedAllowance, pf, professionalTax };
}
