import express from "express";
import { protect } from "../middleware/auth.js";

// Placeholder — leave request/approval + allocation endpoints land here.
// See docs/dayflow-spec.md → Time Off.
const router = express.Router();

router.use(protect);

export default router;
