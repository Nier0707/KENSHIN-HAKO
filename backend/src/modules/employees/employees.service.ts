import { prisma } from "../../db/prisma";
import { hashPassword } from "../../utils/password";
import { AppError } from "../../middleware/errorHandler";

export interface CreateEmployeeInput {
  fullName: string;
  email: string;
  phone?: string;
  password: string;
  roleId: string;
  branchId?: string;
}

const EMPLOYEE_SELECT = {
  id: true,
  fullName: true,
  email: true,
  phone: true,
  isActive: true,
  createdAt: true,
  role: { select: { id: true, name: true } },
  branch: { select: { id: true, name: true } },
} as const;

export async function listEmployees() {
  return prisma.employee.findMany({
    select: EMPLOYEE_SELECT,
    orderBy: { createdAt: "desc" },
  });
}

export async function createEmployee(
  input: CreateEmployeeInput,
  actorEmployeeId: string
) {
  const existing = await prisma.employee.findUnique({ where: { email: input.email } });
  if (existing) {
    throw new AppError("An employee with this email already exists", 409);
  }

  const role = await prisma.role.findUnique({ where: { id: input.roleId } });
  if (!role) {
    throw new AppError("Role not found", 400);
  }

  const passwordHash = await hashPassword(input.password);

  const employee = await prisma.employee.create({
    data: {
      fullName: input.fullName,
      email: input.email,
      phone: input.phone,
      passwordHash,
      roleId: input.roleId,
      branchId: input.branchId,
    },
    select: EMPLOYEE_SELECT,
  });

  await prisma.auditLog.create({
    data: {
      employeeId: actorEmployeeId,
      action: "employee.create",
      entityType: "Employee",
      entityId: employee.id,
      afterValue: employee,
    },
  });

  return employee;
}

export async function deactivateEmployee(
  employeeId: string,
  actorEmployeeId: string
) {
  const before = await prisma.employee.findUnique({ where: { id: employeeId } });
  if (!before) {
    throw new AppError("Employee not found", 404);
  }

  if (before.id === actorEmployeeId) {
    throw new AppError("You cannot deactivate your own account", 400);
  }

  const after = await prisma.employee.update({
    where: { id: employeeId },
    data: { isActive: false },
    select: EMPLOYEE_SELECT,
  });

  await prisma.auditLog.create({
    data: {
      employeeId: actorEmployeeId,
      action: "employee.deactivate",
      entityType: "Employee",
      entityId: employeeId,
      beforeValue: { isActive: before.isActive },
      afterValue: { isActive: after.isActive },
    },
  });

  return after;
}
