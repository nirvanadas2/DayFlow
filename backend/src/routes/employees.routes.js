import express from "express";
import { protect } from "../middleware/auth.js";

// Placeholder — employee directory / profile endpoints (Profile, Private Info,
// Salary Info tabs) land here. See docs/dayflow-spec.md → Employee profile.
const router = express.Router();

router.use(protect);

export default router;
