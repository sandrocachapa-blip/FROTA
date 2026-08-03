import {
  date,
  integer,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const vehicleStatusEnum = pgEnum("vehicle_status", [
  "active",
  "maintenance",
  "inactive",
]);

export const fuelTypeEnum = pgEnum("fuel_type", [
  "diesel",
  "gasoline",
  "electric",
  "hybrid",
]);

export const maintenanceStatusEnum = pgEnum("maintenance_status", [
  "scheduled",
  "in_progress",
  "completed",
]);

export const vehicles = pgTable("vehicles", {
  id: uuid("id").defaultRandom().primaryKey(),
  registration: varchar("registration", { length: 32 }).notNull().unique(),
  brand: varchar("brand", { length: 80 }).notNull(),
  model: varchar("model", { length: 100 }).notNull(),
  year: integer("year").notNull(),
  type: varchar("type", { length: 60 }).notNull(),
  fuelType: fuelTypeEnum("fuel_type").notNull().default("diesel"),
  status: vehicleStatusEnum("status").notNull().default("active"),
  driver: varchar("driver", { length: 140 }),
  costCenter: varchar("cost_center", { length: 40 }).notNull().default("CC 10"),
  mileage: integer("mileage").notNull().default(0),
  acquisitionDate: date("acquisition_date"),
  acquisitionValue: numeric("acquisition_value", { precision: 14, scale: 2 }),
  insuranceValidUntil: date("insurance_valid_until"),
  inspectionValidUntil: date("inspection_valid_until"),
  color: varchar("color", { length: 40 }),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const fuelEntries = pgTable("fuel_entries", {
  id: uuid("id").defaultRandom().primaryKey(),
  vehicleId: uuid("vehicle_id")
    .notNull()
    .references(() => vehicles.id, { onDelete: "cascade" }),
  date: date("date").notNull(),
  liters: numeric("liters", { precision: 10, scale: 2 }).notNull(),
  totalCost: numeric("total_cost", { precision: 14, scale: 2 }).notNull(),
  mileage: integer("mileage").notNull(),
  supplier: varchar("supplier", { length: 140 }),
  invoiceNumber: varchar("invoice_number", { length: 80 }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const maintenanceEntries = pgTable("maintenance_entries", {
  id: uuid("id").defaultRandom().primaryKey(),
  vehicleId: uuid("vehicle_id")
    .notNull()
    .references(() => vehicles.id, { onDelete: "cascade" }),
  date: date("date").notNull(),
  nextDate: date("next_date"),
  description: varchar("description", { length: 240 }).notNull(),
  supplier: varchar("supplier", { length: 140 }),
  cost: numeric("cost", { precision: 14, scale: 2 }).notNull().default("0"),
  mileage: integer("mileage"),
  status: maintenanceStatusEnum("status").notNull().default("scheduled"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const vehicleDocuments = pgTable("vehicle_documents", {
  id: uuid("id").defaultRandom().primaryKey(),
  vehicleId: uuid("vehicle_id")
    .notNull()
    .references(() => vehicles.id, { onDelete: "cascade" }),
  type: varchar("type", { length: 80 }).notNull(),
  reference: varchar("reference", { length: 120 }),
  validUntil: date("valid_until").notNull(),
  fileUrl: text("file_url"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export type Vehicle = typeof vehicles.$inferSelect;
export type NewVehicle = typeof vehicles.$inferInsert;
export type FuelEntry = typeof fuelEntries.$inferSelect;
export type MaintenanceEntry = typeof maintenanceEntries.$inferSelect;
export type VehicleDocument = typeof vehicleDocuments.$inferSelect;

