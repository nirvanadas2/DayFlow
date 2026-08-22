import express from "express";
import { protect, roleCheck } from "../middleware/auth.js";
import { getSalarySettings, updateSalarySettings } from "../controllers/salarySettings.controller.js";

// Company-wide salary percentages — admin only. See
// docs/dayflow-spec.md → Employee profile → Salary Info.
const router = express.Router();

router.use(protect, roleCheck("admin"));

router.get("/", getSalarySettings);
router.put("/", updateSalarySettings);

export default router;
