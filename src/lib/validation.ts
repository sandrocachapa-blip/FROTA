import { z } from "zod";

const optionalDate = z
  .string()
  .optional()
  .nullable()
  .transform((value) => value || null);

export const vehicleSchema = z.object({
  registration: z.string().trim().min(3).max(32).transform((value) => value.toUpperCase()),
  brand: z.string().trim().min(2).max(80),
  model: z.string().trim().min(1).max(100),
  year: z.coerce.number().int().min(1990).max(new Date().getFullYear() + 1),
  type: z.string().trim().min(2).max(60),
  fuelType: z.enum(["diesel", "gasoline", "electric", "hybrid"]),
  status: z.enum(["active", "maintenance", "inactive"]),
  driver: z.string().trim().max(140).optional().nullable().transform((v) => v || null),
  costCenter: z.string().trim().min(2).max(40),
  mileage: z.coerce.number().int().min(0),
  acquisitionDate: optionalDate,
  acquisitionValue: z.coerce.number().min(0).optional().nullable(),
  insuranceValidUntil: optionalDate,
  inspectionValidUntil: optionalDate,
  color: z.string().trim().max(40).optional().nullable().transform((v) => v || null),
  notes: z.string().trim().max(1000).optional().nullable().transform((v) => v || null),
});

export const fuelEntrySchema = z.object({
  vehicleId: z.string().uuid(),
  date: z.string().date(),
  liters: z.coerce.number().positive(),
  totalCost: z.coerce.number().positive(),
  mileage: z.coerce.number().int().min(0),
  supplier: z.string().trim().max(140).optional().nullable().transform((v) => v || null),
  invoiceNumber: z.string().trim().max(80).optional().nullable().transform((v) => v || null),
});

export const maintenanceEntrySchema = z.object({
  vehicleId: z.string().uuid(),
  date: z.string().date(),
  nextDate: optionalDate,
  description: z.string().trim().min(3).max(240),
  supplier: z.string().trim().max(140).optional().nullable().transform((v) => v || null),
  cost: z.coerce.number().min(0),
  mileage: z.coerce.number().int().min(0).optional().nullable(),
  status: z.enum(["scheduled", "in_progress", "completed"]),
  notes: z.string().trim().max(1000).optional().nullable().transform((v) => v || null),
});

export const documentSchema = z.object({
  vehicleId: z.string().uuid(),
  type: z.string().trim().min(2).max(80),
  reference: z.string().trim().max(120).optional().nullable().transform((v) => v || null),
  validUntil: z.string().date(),
  fileUrl: z.string().url().optional().nullable().or(z.literal("")).transform((v) => v || null),
  notes: z.string().trim().max(1000).optional().nullable().transform((v) => v || null),
});

