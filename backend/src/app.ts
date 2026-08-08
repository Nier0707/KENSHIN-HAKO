import express from "express";
import cors from "cors";
import { corsOrigins } from "./config/env";
import { errorHandler } from "./middleware/errorHandler";
import authRoutes from "./modules/auth/auth.routes";
import employeesRoutes from "./modules/employees/employees.routes";
import rolesRoutes from "./modules/employees/roles.routes";
import branchesRoutes from "./modules/employees/branches.routes";
import customersRoutes from "./modules/customers/customers.routes";

export function createApp() {
  const app = express();

  app.use(cors({ origin: corsOrigins, credentials: true }));
  app.use(express.json({ limit: "1mb" }));

  app.get("/health", (_req, res) => res.json({ status: "ok" }));

  app.use("/api/auth", authRoutes);
  app.use("/api/employees", employeesRoutes);
  app.use("/api/roles", rolesRoutes);
  app.use("/api/branches", branchesRoutes);
  app.use("/api/customers", customersRoutes);

  // 404 for anything unmatched
  app.use((req, res) => {
    res.status(404).json({ error: `No route for ${req.method} ${req.path}` });
  });

  // Must be registered last.
  app.use(errorHandler);

  return app;
}
