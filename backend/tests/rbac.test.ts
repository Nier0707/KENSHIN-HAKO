import { describe, it, expect } from "vitest";
import express from "express";
import request from "supertest";
import { requirePermission } from "../src/middleware/rbac";
import type { AuthTokenPayload } from "../src/utils/jwt";

// Builds a minimal app that fakes an already-authenticated request
// (bypassing requireAuth) so this test isolates RBAC logic specifically —
// the thing every route in the system depends on for safety.
function buildTestApp(auth: AuthTokenPayload | undefined) {
  const app = express();
  app.use((req, _res, next) => {
    req.auth = auth;
    next();
  });
  app.get("/protected", requirePermission("employee.manage"), (_req, res) => {
    res.json({ ok: true });
  });
  return app;
}

describe("requirePermission middleware", () => {
  it("allows a request whose role has the required permission", async () => {
    const app = buildTestApp({
      employeeId: "e1",
      roleId: "r1",
      roleName: "Owner",
      branchId: null,
      permissions: ["employee.manage"],
    });

    const res = await request(app).get("/protected");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });
  });

  it("rejects a request whose role lacks the required permission", async () => {
    const app = buildTestApp({
      employeeId: "e2",
      roleId: "r2",
      roleName: "Delivery Rider",
      branchId: null,
      permissions: ["delivery.viewOwnOnly"],
    });

    const res = await request(app).get("/protected");
    expect(res.status).toBe(403);
  });

  it("rejects an unauthenticated request", async () => {
    const app = buildTestApp(undefined);
    const res = await request(app).get("/protected");
    expect(res.status).toBe(401);
  });
});
