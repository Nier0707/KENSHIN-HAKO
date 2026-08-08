import { Router } from "express";
import { requireAuth } from "../../middleware/auth";
import { requireAnyPermission, requirePermission } from "../../middleware/rbac";
import {
  listHandler,
  getHandler,
  createHandler,
  updateHandler,
  addSenderHandler,
  addReceiverHandler,
} from "./customers.controller";

const router = Router();

router.use(requireAuth);

// View: either "manage" (own branch) or "viewAllBranches" (Accountant/Owner) is enough.
const VIEW_PERMISSIONS = ["customer.manage", "customer.viewAllBranches"];

router.get("/", requireAnyPermission(VIEW_PERMISSIONS), listHandler);
router.get("/:id", requireAnyPermission(VIEW_PERMISSIONS), getHandler);

// Create/edit require "manage" — Accountant (view-only) is intentionally excluded.
router.post("/", requirePermission("customer.manage"), createHandler);
router.patch("/:id", requirePermission("customer.manage"), updateHandler);
router.post("/:id/senders", requirePermission("customer.manage"), addSenderHandler);
router.post("/:id/receivers", requirePermission("customer.manage"), addReceiverHandler);

export default router;
