import express from "express";
import { protect, roleCheck } from "../middleware/auth.js";
import { listEmployees, getEmployeeById } from "../controllers/employees.controller.js";

// Employee directory / profile endpoints. Profile, Private Info, and Salary
// Info tabs land here in Phase 3 — see docs/dayflow-spec.md → Employee profile.
const router = express.Router();

router.use(protect);

router.get("/", roleCheck("admin"), listEmployees);
router.get("/:id", roleCheck("admin"), getEmployeeById);

export default router;
