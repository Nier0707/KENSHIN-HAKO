import { prisma } from "../../db/prisma";
import { AppError } from "../../middleware/errorHandler";
import type { AuthTokenPayload } from "../../utils/jwt";

export interface CreateCustomerInput {
  fullName: string;
  phone: string;
  email?: string;
  address?: string;
  originCountry?: string;
  preferredContactChannel?: "sms" | "email" | "messenger";
  branchId: string;
}

export interface UpdateCustomerInput {
  fullName?: string;
  phone?: string;
  email?: string;
  address?: string;
  originCountry?: string;
  preferredContactChannel?: "sms" | "email" | "messenger";
}

const CUSTOMER_SELECT = {
  id: true,
  fullName: true,
  phone: true,
  email: true,
  address: true,
  originCountry: true,
  preferredContactChannel: true,
  createdAt: true,
  branch: { select: { id: true, name: true, country: true } },
  _count: { select: { senders: true, receivers: true } },
} as const;

// Owner (customer.viewAllBranches or customer.manage as Owner) sees everyone;
// Branch Staff (customer.manage only, not viewAllBranches) sees only their branch.
// Mirrors the "Edit shipment details: Owner / Branch Staff (own branch)" row
// in the Phase 1 roles matrix, applied to customers.
function branchScope(auth: AuthTokenPayload) {
  if (auth.permissions.includes("customer.viewAllBranches")) {
    return {};
  }
  if (!auth.branchId) {
    throw new AppError("Your account has no branch assigned", 403);
  }
  return { branchId: auth.branchId };
}

export async function listCustomers(auth: AuthTokenPayload, search?: string) {
  return prisma.customer.findMany({
    where: {
      ...branchScope(auth),
      ...(search
        ? {
            OR: [
              { fullName: { contains: search, mode: "insensitive" as const } },
              { phone: { contains: search } },
              { email: { contains: search, mode: "insensitive" as const } },
            ],
          }
        : {}),
    },
    select: CUSTOMER_SELECT,
    orderBy: { createdAt: "desc" },
  });
}

export async function getCustomer(auth: AuthTokenPayload, id: string) {
  const customer = await prisma.customer.findUnique({
    where: { id },
    select: {
      ...CUSTOMER_SELECT,
      senders: { orderBy: { createdAt: "desc" } },
      receivers: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!customer) {
    throw new AppError("Customer not found", 404);
  }

  if (
    !auth.permissions.includes("customer.viewAllBranches") &&
    customer.branch.id !== auth.branchId
  ) {
    throw new AppError("Customer not found", 404); // don't leak cross-branch existence
  }

  return customer;
}

export async function createCustomer(
  auth: AuthTokenPayload,
  input: CreateCustomerInput
) {
  // Branch Staff can only register customers under their own branch,
  // regardless of what branchId the request claims.
  const branchId = auth.permissions.includes("customer.viewAllBranches")
    ? input.branchId
    : auth.branchId;

  if (!branchId) {
    throw new AppError("A branch is required", 400);
  }

  const customer = await prisma.customer.create({
    data: { ...input, branchId, registeredByEmployeeId: auth.employeeId },
    select: CUSTOMER_SELECT,
  });

  await prisma.auditLog.create({
    data: {
      employeeId: auth.employeeId,
      action: "customer.create",
      entityType: "Customer",
      entityId: customer.id,
      afterValue: customer,
    },
  });

  return customer;
}

export async function updateCustomer(
  auth: AuthTokenPayload,
  id: string,
  input: UpdateCustomerInput
) {
  const existing = await getCustomer(auth, id); // reuses branch-scope check + 404

  const updated = await prisma.customer.update({
    where: { id },
    data: input,
    select: CUSTOMER_SELECT,
  });

  await prisma.auditLog.create({
    data: {
      employeeId: auth.employeeId,
      action: "customer.update",
      entityType: "Customer",
      entityId: id,
      beforeValue: existing,
      afterValue: updated,
    },
  });

  return updated;
}

export interface CreateSenderInput {
  fullName: string;
  phone: string;
  addressAbroad: string;
  idDocumentRef?: string;
}

export async function addSender(
  auth: AuthTokenPayload,
  customerId: string,
  input: CreateSenderInput
) {
  await getCustomer(auth, customerId); // enforces branch scope + existence

  const sender = await prisma.sender.create({
    data: { ...input, customerId },
  });

  await prisma.auditLog.create({
    data: {
      employeeId: auth.employeeId,
      action: "sender.create",
      entityType: "Sender",
      entityId: sender.id,
      afterValue: sender,
    },
  });

  return sender;
}

export interface CreateReceiverInput {
  fullName: string;
  phone: string;
  addressPh: string;
  region?: string;
}

export async function addReceiver(
  auth: AuthTokenPayload,
  customerId: string,
  input: CreateReceiverInput
) {
  await getCustomer(auth, customerId); // enforces branch scope + existence

  const receiver = await prisma.receiver.create({
    data: { ...input, customerId },
  });

  await prisma.auditLog.create({
    data: {
      employeeId: auth.employeeId,
      action: "receiver.create",
      entityType: "Receiver",
      entityId: receiver.id,
      afterValue: receiver,
    },
  });

  return receiver;
}
