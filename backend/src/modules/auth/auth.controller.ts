import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { login as loginService } from "./auth.service";
import { prisma } from "../../db/prisma";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function loginHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password } = loginSchema.parse(req.body);
    const result = await loginService(email, password);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

// Lets the frontend re-hydrate "who am I" from a stored token
// (e.g. after a page refresh) without re-sending credentials.
export async function meHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const employee = await prisma.employee.findUniqueOrThrow({
      where: { id: req.auth!.employeeId },
      select: {
        id: true,
        fullName: true,
        email: true,
        branchId: true,
        role: { select: { name: true } },
      },
    });

    res.json({
      id: employee.id,
      fullName: employee.fullName,
      email: employee.email,
      role: employee.role.name,
      branchId: employee.branchId,
      permissions: req.auth!.permissions,
    });
  } catch (err) {
    next(err);
  }
}
