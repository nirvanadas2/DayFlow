// Pure salary calculation — mirrors backend/src/models/SalarySettings.js's
// percentage fields exactly. See docs/dayflow-spec.md → Employee profile →
// Salary Info for the example formulas this implements.

// settings: { basicPercent, hraPercent, standardAllowancePercent,
// performanceBonusPercent, leaveTravelAllowancePercent, pfPercent,
// professionalTax }
export function calculateSalary(wage, settings) {
  const w = Number(wage) || 0;

  const basic = w * ((Number(settings.basicPercent) || 0) / 100);
  const hra = basic * ((Number(settings.hraPercent) || 0) / 100);
  const standardAllowance = w * ((Number(settings.standardAllowancePercent) || 0) / 100);
  const performanceBonus = w * ((Number(settings.performanceBonusPercent) || 0) / 100);
  const leaveTravelAllowance = w * ((Number(settings.leaveTravelAllowancePercent) || 0) / 100);

  const componentTotal = basic + hra + standardAllowance + performanceBonus + leaveTravelAllowance;
  const fixedAllowance = w - componentTotal;
  const overage = componentTotal > w ? componentTotal - w : 0;

  const pf = basic * ((Number(settings.pfPercent) || 0) / 100);
  const professionalTax = Number(settings.professionalTax) || 0;

  return {
    basic,
    hra,
    standardAllowance,
    performanceBonus,
    leaveTravelAllowance,
    fixedAllowance,
    pf,
    professionalTax,
    overage,
  };
}

export function formatCurrency(amount) {
  const n = Number(amount) || 0;
  return `₹${n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
