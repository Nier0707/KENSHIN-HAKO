import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/utils/password";

const prisma = new PrismaClient();

// Permission keys used across the whole system (not just Milestone 1).
// Later milestones will start enforcing the shipment/payment ones;
// defining them all now keeps the roles matrix stable across milestones.
const PERMISSIONS: { key: string; label: string }[] = [
  { key: "customer.manage", label: "Create/edit customers, senders, receivers" },
  { key: "customer.viewAllBranches", label: "View customers across all branches" },
  { key: "shipment.create", label: "Create booking" },
  { key: "shipment.edit", label: "Edit shipment details" },
  { key: "shipment.viewAllBranches", label: "View all branches" },
  { key: "shipment.updateStatus", label: "Update shipment status" },
  { key: "shipment.updateStatus.deliveryOnly", label: "Update delivery status only" },
  { key: "payment.record", label: "Record payment" },
  { key: "payment.editVoid", label: "Edit/void payment" },
  { key: "payment.reconcile", label: "Reconcile payments" },
  { key: "delivery.assign", label: "Assign pickups/deliveries" },
  { key: "delivery.viewAssigned", label: "View assigned deliveries" },
  { key: "delivery.viewOwnOnly", label: "View own assigned deliveries only" },
  { key: "employee.manage", label: "Manage employees" },
  { key: "report.viewFinancial", label: "View financial reports" },
  { key: "report.export", label: "Export reports" },
  { key: "report.export.ownBranchOnly", label: "Export reports for own branch only" },
  { key: "auditLog.view", label: "View audit logs" },
];

// Roles × Permissions, transcribed directly from the Phase 1 matrix.
const ROLE_PERMISSIONS: Record<string, string[]> = {
  Owner: PERMISSIONS.map((p) => p.key), // full access
  "Branch Staff": [
    "customer.manage",
    "shipment.create",
    "shipment.edit",
    "shipment.updateStatus",
    "payment.record",
    "report.export.ownBranchOnly",
  ],
  Dispatcher: [
    "shipment.updateStatus",
    "delivery.assign",
    "delivery.viewAssigned",
  ],
  "Delivery Rider": [
    "shipment.updateStatus.deliveryOnly",
    "delivery.viewOwnOnly",
    "payment.record", // COD collection only — enforced at the service layer, not just RBAC
  ],
  Accountant: [
    "customer.viewAllBranches",
    "shipment.viewAllBranches",
    "payment.record",
    "payment.editVoid",
    "payment.reconcile",
    "report.viewFinancial",
    "report.export",
  ],
};

async function main() {
  console.log("Seeding branches...");
  const mainBranch = await prisma.branch.upsert({
    where: { id: "00000000-0000-0000-0000-000000000001" },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-000000000001",
      name: "Main Branch",
      country: "PH",
    },
  });

  console.log("Seeding permissions...");
  // Sequential, not Promise.all — Supabase's free-tier pooler caps
  // concurrent sessions.
  const permissionByKey: Record<string, { id: string; key: string }> = {};
  for (const p of PERMISSIONS) {
    const record = await prisma.permission.upsert({
      where: { key: p.key },
      update: { label: p.label },
      create: p,
    });
    permissionByKey[p.key] = record;
  }

  console.log("Seeding roles and role-permission matrix...");
  for (const [roleName, keys] of Object.entries(ROLE_PERMISSIONS)) {
    const role = await prisma.role.upsert({
      where: { name: roleName },
      update: {},
      create: { name: roleName },
    });

    for (const key of keys) {
      const permission = permissionByKey[key];
      if (!permission) {
        throw new Error(`Unknown permission key in seed data: ${key}`);
      }
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: { roleId: role.id, permissionId: permission.id },
        },
        update: {},
        create: { roleId: role.id, permissionId: permission.id },
      });
    }
  }

  console.log("Seeding initial Owner account...");
  const ownerRole = await prisma.role.findUniqueOrThrow({ where: { name: "Owner" } });
  const ownerEmail = process.env.SEED_OWNER_EMAIL ?? "owner@kenshinhako.com";
  const ownerPassword = process.env.SEED_OWNER_PASSWORD ?? "ChangeMe123!";

  await prisma.employee.upsert({
    where: { email: ownerEmail },
    update: {},
    create: {
      fullName: "System Owner",
      email: ownerEmail,
      passwordHash: await hashPassword(ownerPassword),
      roleId: ownerRole.id,
      branchId: mainBranch.id,
    },
  });

  console.log(`Done. Owner login: ${ownerEmail} / ${ownerPassword}`);
  console.log("⚠ Change this password immediately after first login.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
