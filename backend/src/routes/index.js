import express from "express";
import authRoutes from "./auth.routes.js";
import employeesRoutes from "./employees.routes.js";
import attendanceRoutes from "./attendance.routes.js";
import timeoffRoutes from "./timeoff.routes.js";
import salarySettingsRoutes from "./salarySettings.routes.js";

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/employees", employeesRoutes);
router.use("/attendance", attendanceRoutes);
router.use("/timeoff", timeoffRoutes);
router.use("/salary-settings", salarySettingsRoutes);

export default router;
