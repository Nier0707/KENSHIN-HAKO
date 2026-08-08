import { Router } from "express";
import { requireAuth } from "../../middleware/auth";
import { requirePermission } from "../../middleware/rbac";
import { listHandler, createHandler, deactivateHandler } from "./employees.controller";

const router = Router();

// Every route requires auth first, then the specific permission —
// matches the "employee.manage" row in the Phase 1 roles matrix
// (Owner only).
router.use(requireAuth);

router.get("/", requirePermission("employee.manage"), listHandler);
router.post("/", requirePermission("employee.manage"), createHandler);
router.patch("/:id/deactivate", requirePermission("employee.manage"), deactivateHandler);

export default router;
