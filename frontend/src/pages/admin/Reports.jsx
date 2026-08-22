import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { api } from "../../lib/api.js";
import { formatCurrency } from "../../lib/salary.js";

const MONTH_FMT = new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" });

// Admin-only analytics/reports dashboard — attendance summary + payroll
// summary, both read-only aggregates of the real Attendance/Salary records
// (nothing here is fabricated). See docs/dayflow-spec.md → Future
// Enhancements.

function AttendanceSummarySection({ token }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const now = new Date();
    api
      .getAttendanceSummary({ month: now.getMonth() + 1, year: now.getFullYear() }, token)
      .then(setData)
      .catch((err) => setError(err.message));
  }, [token]);

  return (
    <section className="reports-section">
      <div className="reports-section-header">
        <h2 className="reports-section-title">Attendance Summary</h2>
        {data && <span className="reports-section-subtitle">{MONTH_FMT.format(new Date(data.year, data.month - 1))}</span>}
      </div>

      {error && <div className="dashboard-error">{error}</div>}
      {!data && !error && <div className="profile-field-value profile-field-readonly">Loading…</div>}

      {data && (
        <div className="attendance-table-wrap">
          <table className="attendance-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Present</th>
                <th>Absent</th>
                <th>Leave</th>
                <th>Present Rate</th>
              </tr>
            </thead>
            <tbody>
              {data.employees.map((row) => (
                <tr key={row.employeeId}>
                  <td>{row.name}</td>
                  <td>{row.presentDays}</td>
                  <td>{row.absentDays}</td>
                  <td>{row.leaveDays}</td>
                  <td>{row.presentRate}%</td>
                </tr>
              ))}
              {data.employees.length === 0 && (
                <tr>
                  <td colSpan={5} className="attendance-empty">
                    No employees yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function PayrollSummarySection({ token }) {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .getPayrollSummary(token)
      .then(setData)
      .catch((err) => setError(err.message));
  }, [token]);

  return (
    <section className="reports-section">
      <div className="reports-section-header">
        <h2 className="reports-section-title">Payroll Summary</h2>
      </div>

      {error && <div className="dashboard-error">{error}</div>}
      {!data && !error && <div className="profile-field-value profile-field-readonly">Loading…</div>}

      {data && (
        <>
          <div className="attendance-stats">
            <div className="attendance-stat-box">
              <span className="attendance-stat-value">{formatCurrency(data.totals.netPay)}</span>
              <span className="attendance-stat-label">Total Disbursed (net)</span>
            </div>
            <div className="attendance-stat-box">
              <span className="attendance-stat-value">{formatCurrency(data.totals.wage)}</span>
              <span className="attendance-stat-label">Total Gross Wage</span>
            </div>
            <div className="attendance-stat-box">
              <span className="attendance-stat-value">{formatCurrency(data.totals.pf)}</span>
              <span className="attendance-stat-label">Total Provident Fund</span>
            </div>
            <div className="attendance-stat-box">
              <span className="attendance-stat-value">{formatCurrency(data.totals.professionalTax)}</span>
              <span className="attendance-stat-label">Total Professional Tax</span>
            </div>
          </div>

          <div className="attendance-table-wrap">
            <table className="attendance-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Wage</th>
                  <th>Basic</th>
                  <th>HRA</th>
                  <th>Standard Allowance</th>
                  <th>Performance Bonus</th>
                  <th>LTA</th>
                  <th>Fixed Allowance</th>
                  <th>PF</th>
                  <th>Professional Tax</th>
                  <th>Net Pay</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {data.employees.map((row) => (
                  <tr key={row.employeeId}>
                    <td>{row.name}</td>
                    <td>{formatCurrency(row.wage)}</td>
                    <td>{formatCurrency(row.basic)}</td>
                    <td>{formatCurrency(row.hra)}</td>
                    <td>{formatCurrency(row.standardAllowance)}</td>
                    <td>{formatCurrency(row.performanceBonus)}</td>
                    <td>{formatCurrency(row.leaveTravelAllowance)}</td>
                    <td>{formatCurrency(row.fixedAllowance)}</td>
                    <td>{formatCurrency(row.pf)}</td>
                    <td>{formatCurrency(row.professionalTax)}</td>
                    <td>{formatCurrency(row.netPay)}</td>
                    <td>
                      <button
                        type="button"
                        className="reports-export-btn"
                        onClick={() => navigate(`/admin/reports/slip/${row.employeeId}`)}
                      >
                        Export PDF
                      </button>
                    </td>
                  </tr>
                ))}
                {data.employees.length === 0 && (
                  <tr>
                    <td colSpan={12} className="attendance-empty">
                      No employees with a configured wage yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  );
}

export default function Reports() {
  const { token } = useAuth();

  return (
    <div className="reports-page">
      <h1 className="attendance-title">Reports</h1>
      <AttendanceSummarySection token={token} />
      <PayrollSummarySection token={token} />
    </div>
  );
}
