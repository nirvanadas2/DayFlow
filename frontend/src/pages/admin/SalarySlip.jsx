import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { api } from "../../lib/api.js";
import { calculateSalary, formatCurrency } from "../../lib/salary.js";

const MONTH_FMT = new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" });

// Printable salary slip for one employee — reached from the Payroll Summary
// table's "Export PDF" button. There's no server-side PDF renderer in this
// app (same "no file storage backend yet" pragmatism as photo/logo data
// URLs), so "export as PDF" uses the browser's own print-to-PDF via
// window.print(), with print CSS (dashboard.css) hiding the chrome around
// it. See docs/dayflow-spec.md → Future Enhancements.
export default function SalarySlip() {
  const { id } = useParams();
  const { token, user } = useAuth();
  const [employee, setEmployee] = useState(null);
  const [settings, setSettings] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([api.getEmployee(id, token), api.getSalarySettings(token)])
      .then(([e, s]) => {
        setEmployee(e);
        setSettings(s);
      })
      .catch((err) => setError(err.message));
  }, [id, token]);

  if (error) return <div className="dashboard-error">{error}</div>;
  if (!employee || !settings) return null;

  const calc = calculateSalary(employee.fixedWage, settings);
  const netPay = (employee.fixedWage || 0) - calc.pf - calc.professionalTax;

  return (
    <div className="slip-page">
      <div className="slip-actions">
        <Link to="/admin/reports" className="profile-back-link">
          ← Back to Reports
        </Link>
        <button type="button" className="reports-export-btn" onClick={() => window.print()}>
          Print / Export PDF
        </button>
      </div>

      <div className="profile-card">
        <div className="slip-meta">
          <span className="slip-meta-company">{user.companyName}</span>
          <h1>{employee.name}</h1>
          <span className="profile-loginid">{employee.loginId}</span>
          <span className="slip-meta-period">Salary Slip — {MONTH_FMT.format(new Date())}</span>
        </div>

        <div className="profile-panel">
          <h3 className="salary-section-title">Wage</h3>
          <div className="salary-components-grid">
            <div className="salary-component-box">
              <span className="profile-field-label">Wage Type</span>
              <span className="salary-component-value" style={{ textTransform: "capitalize" }}>
                {employee.wageType || "—"}
              </span>
            </div>
            <div className="salary-component-box">
              <span className="profile-field-label">Fixed Wage</span>
              <span className="salary-component-value">{formatCurrency(employee.fixedWage)}</span>
            </div>
          </div>

          <div className="salary-breakdown">
            <h3 className="salary-section-title">Earnings</h3>
            <div className="salary-components-grid">
              <div className="salary-component-box">
                <span className="profile-field-label">Basic</span>
                <span className="salary-component-value">{formatCurrency(calc.basic)}</span>
              </div>
              <div className="salary-component-box">
                <span className="profile-field-label">HRA</span>
                <span className="salary-component-value">{formatCurrency(calc.hra)}</span>
              </div>
              <div className="salary-component-box">
                <span className="profile-field-label">Standard Allowance</span>
                <span className="salary-component-value">{formatCurrency(calc.standardAllowance)}</span>
              </div>
              <div className="salary-component-box">
                <span className="profile-field-label">Performance Bonus</span>
                <span className="salary-component-value">{formatCurrency(calc.performanceBonus)}</span>
              </div>
              <div className="salary-component-box">
                <span className="profile-field-label">Leave Travel Allowance</span>
                <span className="salary-component-value">{formatCurrency(calc.leaveTravelAllowance)}</span>
              </div>
              <div className="salary-component-box">
                <span className="profile-field-label">Fixed Allowance</span>
                <span className="salary-component-value">{formatCurrency(calc.fixedAllowance)}</span>
              </div>
            </div>
          </div>

          <div className="salary-breakdown">
            <h3 className="salary-section-title">Deductions</h3>
            <div className="salary-components-grid">
              <div className="salary-component-box">
                <span className="profile-field-label">Provident Fund (PF)</span>
                <span className="salary-component-value">{formatCurrency(calc.pf)}</span>
              </div>
              <div className="salary-component-box">
                <span className="profile-field-label">Professional Tax</span>
                <span className="salary-component-value">{formatCurrency(calc.professionalTax)}</span>
              </div>
            </div>
          </div>

          <div className="slip-net-pay">
            <span className="slip-net-pay-label">Net Pay</span>
            <span className="slip-net-pay-value">{formatCurrency(netPay)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
