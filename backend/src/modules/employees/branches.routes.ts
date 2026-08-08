import { Router } from "express";
import { requireAuth } from "../../middleware/auth";
import { requirePermission } from "../../middleware/rbac";
import { prisma } from "../../db/prisma";

const router = Router();

router.use(requireAuth);

router.get("/", requirePermission("employee.manage"), async (_req, res, next) => {
  try {
    const branches = await prisma.branch.findMany({
      select: { id: true, name: true, country: true },
      orderBy: { name: "asc" },
    });
    res.json(branches);
  } catch (err) {
    next(err);
  }
});

export default router;
