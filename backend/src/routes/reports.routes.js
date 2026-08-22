import express from "express";
import { protect, roleCheck } from "../middleware/auth.js";
import { attendanceSummary, payrollSummary } from "../controllers/reports.controller.js";

// Admin-only analytics/reports dashboard endpoints — read-only, aggregated
// from Attendance/SalarySettings/User, no separate report storage. See
// docs/dayflow-spec.md → Future Enhancements.
const router = express.Router();

router.use(protect, roleCheck("admin"));

router.get("/attendance-summary", attendanceSummary);
router.get("/payroll-summary", payrollSummary);

export default router;
