import express from "express";
import { protect } from "../middleware/auth.js";

// Placeholder — check in/out + attendance table endpoints land here.
// See docs/dayflow-spec.md → Attendance.
const router = express.Router();

router.use(protect);

export default router;
