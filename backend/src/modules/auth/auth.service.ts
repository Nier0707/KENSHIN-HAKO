import { prisma } from "../../db/prisma";
import { verifyPassword } from "../../utils/password";
import { signAuthToken } from "../../utils/jwt";
import { AppError } from "../../middleware/errorHandler";

export async function login(email: string, password: string) {
  const employee = await prisma.employee.findUnique({
    where: { email },
    include: { role: { include: { permissions: { include: { permission: true } } } } },
  });

  // Same error for "no such user" and "wrong password" — never reveal
  // which one it was, that leaks account existence to an attacker.
  if (!employee || !employee.isActive) {
    throw new AppError("Invalid email or password", 401);
  }

  const passwordOk = await verifyPassword(password, employee.passwordHash);
  if (!passwordOk) {
    throw new AppError("Invalid email or password", 401);
  }

  const permissions = employee.role.permissions.map((rp) => rp.permission.key);

  const token = signAuthToken({
    employeeId: employee.id,
    roleId: employee.roleId,
    roleName: employee.role.name,
    branchId: employee.branchId,
    permissions,
  });

  return {
    token,
    employee: {
      id: employee.id,
      fullName: employee.fullName,
      email: employee.email,
      role: employee.role.name,
      branchId: employee.branchId,
      permissions,
    },
  };
}
