import express from "express";
import { protect, roleCheck } from "../middleware/auth.js";
import { listEmployees, getEmployeeById, updateEmployeeById } from "../controllers/employees.controller.js";

// Employee directory / profile endpoints — see docs/dayflow-spec.md →
// Employee profile. The grid is admin-only; :id routes allow admin (any
// employee) or a signed-in employee viewing/editing themself — enforced in
// the controller since that needs the target id, not just the role.
const router = express.Router();

router.use(protect);

router.get("/", roleCheck("admin"), listEmployees);
router.get("/:id", getEmployeeById);
router.patch("/:id", updateEmployeeById);

export default router;
