import express from "express";
import { protect } from "../middleware/auth.js";
import { listMine, markAllRead } from "../controllers/notifications.controller.js";

// In-app notification bell endpoints — self only, no admin view. See
// docs/dayflow-spec.md → Future Enhancements.
const router = express.Router();

router.use(protect);

router.get("/", listMine);
router.post("/read-all", markAllRead);

export default router;
