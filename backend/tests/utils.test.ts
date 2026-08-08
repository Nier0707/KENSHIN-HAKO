import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword } from "../src/utils/password";
import { signAuthToken, verifyAuthToken } from "../src/utils/jwt";

describe("password hashing", () => {
  it("verifies a correct password against its hash", async () => {
    const hash = await hashPassword("correct-horse-battery-staple");
    expect(await verifyPassword("correct-horse-battery-staple", hash)).toBe(true);
  });

  it("rejects an incorrect password", async () => {
    const hash = await hashPassword("correct-horse-battery-staple");
    expect(await verifyPassword("wrong-password", hash)).toBe(false);
  });

  it("never stores the plaintext password in the hash", async () => {
    const hash = await hashPassword("correct-horse-battery-staple");
    expect(hash).not.toContain("correct-horse-battery-staple");
  });
});

describe("JWT auth tokens", () => {
  const payload = {
    employeeId: "emp-1",
    roleId: "role-1",
    roleName: "Owner",
    branchId: "branch-1",
    permissions: ["employee.manage"],
  };

  it("round-trips a signed token", () => {
    const token = signAuthToken(payload);
    const decoded = verifyAuthToken(token);
    expect(decoded.employeeId).toBe(payload.employeeId);
    expect(decoded.permissions).toEqual(payload.permissions);
  });

  it("throws on a tampered token", () => {
    const token = signAuthToken(payload);
    const tampered = token.slice(0, -2) + "xx";
    expect(() => verifyAuthToken(tampered)).toThrow();
  });
});
