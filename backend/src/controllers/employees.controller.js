import User from "../models/User.js";

// GET /api/employees (admin/HR only)
// Backs the dashboard employee grid — see docs/dayflow-spec.md → Dashboard.
export async function listEmployees(req, res) {
  const employees = await User.find({ companyCode: req.user.companyCode }).select(
    "name email role loginId attendanceStatus"
  );

  res.json(employees);
}

// GET /api/employees/:id (admin/HR only)
// Backs the read-only employee profile placeholder opened from a grid card.
export async function getEmployeeById(req, res) {
  const employee = await User.findOne({
    _id: req.params.id,
    companyCode: req.user.companyCode,
  }).select("name email phone role loginId companyName attendanceStatus");

  if (!employee) {
    return res.status(404).json({ message: "Employee not found" });
  }

  res.json(employee);
}
