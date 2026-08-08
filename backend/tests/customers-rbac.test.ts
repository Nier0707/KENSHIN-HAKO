import { describe, it, expect } from "vitest";
import express from "express";
import request from "supertest";
import { requireAnyPermission } from "../src/middleware/rbac";
import type { AuthTokenPayload } from "../src/utils/jwt";

function buildTestApp(auth: AuthTokenPayload | undefined) {
  const app = express();
  app.use((req, _res, next) => {
    req.auth = auth;
    next();
  });
  app.get(
    "/customers",
    requireAnyPermission(["customer.manage", "customer.viewAllBranches"]),
    (_req, res) => res.json({ ok: true })
  );
  return app;
}

describe("requireAnyPermission middleware", () => {
  it("allows Branch Staff (customer.manage) through", async () => {
    const app = buildTestApp({
      employeeId: "e1",
      roleId: "r1",
      roleName: "Branch Staff",
      branchId: "branch-1",
      permissions: ["customer.manage"],
    });
    const res = await request(app).get("/customers");
    expect(res.status).toBe(200);
  });

  it("allows Accountant (customer.viewAllBranches) through", async () => {
    const app = buildTestApp({
      employeeId: "e2",
      roleId: "r2",
      roleName: "Accountant",
      branchId: null,
      permissions: ["customer.viewAllBranches"],
    });
    const res = await request(app).get("/customers");
    expect(res.status).toBe(200);
  });

  it("rejects a role with neither permission", async () => {
    const app = buildTestApp({
      employeeId: "e3",
      roleId: "r3",
      roleName: "Delivery Rider",
      branchId: "branch-1",
      permissions: ["delivery.viewOwnOnly"],
    });
    const res = await request(app).get("/customers");
    expect(res.status).toBe(403);
  });
});
