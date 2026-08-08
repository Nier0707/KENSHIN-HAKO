import { Request, Response, NextFunction } from "express";

/**
 * requirePermission("employee.manage") -> 403 if the authenticated
 * employee's role does not carry that permission key.
 *
 * Must run AFTER requireAuth (needs req.auth to be populated).
 * This is the server-side enforcement point referenced throughout
 * the roles matrix in Phase 1 — the UI hiding a button is not
 * sufficient on its own anywhere in this system.
 */
export function requirePermission(permissionKey: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.auth) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    if (!req.auth.permissions.includes(permissionKey)) {
      return res.status(403).json({
        error: `Forbidden: missing permission "${permissionKey}"`,
      });
    }

    next();
  };
}

/**
 * requireAnyPermission(["customer.manage", "customer.viewAllBranches"])
 * -> passes if the employee's role carries at least one of the listed keys.
 * Used where multiple roles should reach a route for different reasons
 * (e.g. Branch Staff to manage their own branch, Accountant to view all).
 */
export function requireAnyPermission(permissionKeys: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.auth) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const hasAny = permissionKeys.some((key) => req.auth!.permissions.includes(key));
    if (!hasAny) {
      return res.status(403).json({
        error: `Forbidden: requires one of [${permissionKeys.join(", ")}]`,
      });
    }

    next();
  };
}
