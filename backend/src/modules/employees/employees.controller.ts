import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import * as employeesService from "./employees.service";

const createEmployeeSchema = z.object({
  fullName: z.string().min(1).max(120),
  email: z.string().email(),
  phone: z.string().max(30).optional(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  roleId: z.string().uuid(),
  branchId: z.string().uuid().optional(),
});

export async function listHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const employees = await employeesService.listEmployees();
    res.json(employees);
  } catch (err) {
    next(err);
  }
}

export async function createHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const input = createEmployeeSchema.parse(req.body);
    const employee = await employeesService.createEmployee(input, req.auth!.employeeId);
    res.status(201).json(employee);
  } catch (err) {
    next(err);
  }
}

export async function deactivateHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = z.object({ id: z.string().uuid() }).parse(req.params);
    const employee = await employeesService.deactivateEmployee(id, req.auth!.employeeId);
    res.json(employee);
  } catch (err) {
    next(err);
  }
}
