import { PrismaClient } from "@prisma/client";

// Single shared instance — avoids exhausting DB connections in dev
// with hot-reload creating a new client per reload.
declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

export const prisma = global.__prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  global.__prisma = prisma;
}
