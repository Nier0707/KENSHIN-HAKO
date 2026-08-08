import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import * as customersService from "./customers.service";

const contactChannel = z.enum(["sms", "email", "messenger"]).optional();

const createCustomerSchema = z.object({
  fullName: z.string().min(1).max(120),
  phone: z.string().min(5).max(30),
  email: z.string().email().optional(),
  address: z.string().max(300).optional(),
  originCountry: z.string().max(60).optional(),
  preferredContactChannel: contactChannel,
  branchId: z.string().uuid().optional(), // ignored for non-viewAllBranches roles; service enforces
});

const updateCustomerSchema = createCustomerSchema.partial().omit({ branchId: true });

const createSenderSchema = z.object({
  fullName: z.string().min(1).max(120),
  phone: z.string().min(5).max(30),
  addressAbroad: z.string().min(1).max(300),
  idDocumentRef: z.string().max(100).optional(),
});

const createReceiverSchema = z.object({
  fullName: z.string().min(1).max(120),
  phone: z.string().min(5).max(30),
  addressPh: z.string().min(1).max(300),
  region: z.string().max(100).optional(),
});

export async function listHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const search = typeof req.query.search === "string" ? req.query.search : undefined;
    const customers = await customersService.listCustomers(req.auth!, search);
    res.json(customers);
  } catch (err) {
    next(err);
  }
}

export async function getHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = z.object({ id: z.string().uuid() }).parse(req.params);
    const customer = await customersService.getCustomer(req.auth!, id);
    res.json(customer);
  } catch (err) {
    next(err);
  }
}

export async function createHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const input = createCustomerSchema.parse(req.body);
    const customer = await customersService.createCustomer(req.auth!, input);
    res.status(201).json(customer);
  } catch (err) {
    next(err);
  }
}

export async function updateHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = z.object({ id: z.string().uuid() }).parse(req.params);
    const input = updateCustomerSchema.parse(req.body);
    const customer = await customersService.updateCustomer(req.auth!, id, input);
    res.json(customer);
  } catch (err) {
    next(err);
  }
}

export async function addSenderHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = z.object({ id: z.string().uuid() }).parse(req.params);
    const input = createSenderSchema.parse(req.body);
    const sender = await customersService.addSender(req.auth!, id, input);
    res.status(201).json(sender);
  } catch (err) {
    next(err);
  }
}

export async function addReceiverHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = z.object({ id: z.string().uuid() }).parse(req.params);
    const input = createReceiverSchema.parse(req.body);
    const receiver = await customersService.addReceiver(req.auth!, id, input);
    res.status(201).json(receiver);
  } catch (err) {
    next(err);
  }
}
