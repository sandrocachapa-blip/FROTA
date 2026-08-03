export type VehicleRecord = {
  id: string;
  registration: string;
  brand: string;
  model: string;
  year: number;
  type: string;
  fuelType: "diesel" | "gasoline" | "electric" | "hybrid";
  status: "active" | "maintenance" | "inactive";
  driver: string | null;
  costCenter: string;
  mileage: number;
  acquisitionDate: string | null;
  acquisitionValue: string | null;
  insuranceValidUntil: string | null;
  inspectionValidUntil: string | null;
  color: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type FuelRecord = {
  id: string;
  vehicleId: string;
  date: string;
  liters: string;
  totalCost: string;
  mileage: number;
  supplier: string | null;
  invoiceNumber: string | null;
  createdAt: string;
};

export type MaintenanceRecord = {
  id: string;
  vehicleId: string;
  date: string;
  nextDate: string | null;
  description: string;
  supplier: string | null;
  cost: string;
  mileage: number | null;
  status: "scheduled" | "in_progress" | "completed";
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type DocumentRecord = {
  id: string;
  vehicleId: string;
  type: string;
  reference: string | null;
  validUntil: string;
  fileUrl: string | null;
  notes: string | null;
  createdAt: string;
};

export type FleetData = {
  vehicles: VehicleRecord[];
  fuelEntries: FuelRecord[];
  maintenanceEntries: MaintenanceRecord[];
  documents: DocumentRecord[];
  isDemo: boolean;
};

