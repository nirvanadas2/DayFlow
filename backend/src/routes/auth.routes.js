import express from "express";
import { signup, login, getMe, createEmployee } from "../controllers/auth.controller.js";
import { protect, roleCheck } from "../middleware/auth.js";

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.get("/me", protect, getMe);

// Only Admin/HR can create employee accounts (no open self-registration).
router.post("/employees", protect, roleCheck("admin"), createEmployee);

export default router;
