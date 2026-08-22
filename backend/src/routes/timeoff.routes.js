import express from "express";
import { protect, roleCheck } from "../middleware/auth.js";
import { listMine, balances, create, listAll, approve, reject } from "../controllers/timeoff.controller.js";

// Leave request/approval endpoints. Allocation (Paid/Sick day balances) is
// set via PATCH /api/employees/:id — see employees.controller.js — since
// it's a per-employee field, not part of this collection. See
// docs/dayflow-spec.md → Time Off.
const router = express.Router();

router.use(protect);

router.get("/me", listMine);
router.get("/balances", balances);
router.post("/", create);

router.get("/admin", roleCheck("admin"), listAll);
router.post("/:id/approve", roleCheck("admin"), approve);
router.post("/:id/reject", roleCheck("admin"), reject);

export default router;
