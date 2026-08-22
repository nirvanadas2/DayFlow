import express from "express";
import authRoutes from "./auth.routes.js";
import employeesRoutes from "./employees.routes.js";
import attendanceRoutes from "./attendance.routes.js";
import timeoffRoutes from "./timeoff.routes.js";
import salarySettingsRoutes from "./salarySettings.routes.js";
import notificationsRoutes from "./notifications.routes.js";
import reportsRoutes from "./reports.routes.js";

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/employees", employeesRoutes);
router.use("/attendance", attendanceRoutes);
router.use("/timeoff", timeoffRoutes);
router.use("/salary-settings", salarySettingsRoutes);
router.use("/notifications", notificationsRoutes);
router.use("/reports", reportsRoutes);

export default router;
