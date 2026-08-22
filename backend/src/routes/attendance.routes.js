import express from "express";
import { protect, roleCheck } from "../middleware/auth.js";
import { checkIn, checkOut, listMine, listForEmployee } from "../controllers/attendance.controller.js";

// Check-in/out + attendance table endpoints. See docs/dayflow-spec.md →
// Attendance. Check-in/out and "my own table" are available to any signed-in
// user (admin included — admins are Users too); the all-employees table is
// admin/HR only.
const router = express.Router();

router.use(protect);

router.post("/check-in", checkIn);
router.post("/check-out", checkOut);
router.get("/me", listMine);
router.get("/admin", roleCheck("admin"), listForEmployee);

export default router;
