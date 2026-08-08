import jwt from "jsonwebtoken";
import { env } from "../config/env";

export interface AuthTokenPayload {
  employeeId: string;
  roleId: string;
  roleName: string;
  branchId: string | null;
  permissions: string[];
}

export function signAuthToken(payload: AuthTokenPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN });
}

export function verifyAuthToken(token: string): AuthTokenPayload {
  // Throws if invalid/expired — callers must catch.
  return jwt.verify(token, env.JWT_SECRET) as AuthTokenPayload;
}
