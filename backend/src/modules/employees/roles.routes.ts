import { Router } from "express";
import { requireAuth } from "../../middleware/auth";
import { requirePermission } from "../../middleware/rbac";
import { prisma } from "../../db/prisma";

const router = Router();

router.use(requireAuth);

// Gated behind employee.manage since roles are only ever needed
// in the context of assigning them to an employee.
router.get("/", requirePermission("employee.manage"), async (_req, res, next) => {
  try {
    const roles = await prisma.role.findMany({
      select: { id: true, name: true, description: true },
      orderBy: { name: "asc" },
    });
    res.json(roles);
  } catch (err) {
    next(err);
  }
});

export default router;
