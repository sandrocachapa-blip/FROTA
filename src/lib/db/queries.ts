import { desc } from "drizzle-orm";
import { demoFleetData } from "../demo-data";
import type { FleetData } from "../fleet-types";
import { getDb, hasDatabase } from ".";
import { fuelEntries, maintenanceEntries, vehicleDocuments, vehicles } from "./schema";

function serialize<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export async function getFleetData(): Promise<FleetData> {
  if (!hasDatabase) return demoFleetData;

  try {
    const db = getDb();
    const [vehicleRows, fuelRows, maintenanceRows, documentRows] = await Promise.all([
      db.select().from(vehicles).orderBy(desc(vehicles.createdAt)),
      db.select().from(fuelEntries).orderBy(desc(fuelEntries.date)),
      db.select().from(maintenanceEntries).orderBy(desc(maintenanceEntries.date)),
      db.select().from(vehicleDocuments).orderBy(desc(vehicleDocuments.validUntil)),
    ]);

    return serialize({
      vehicles: vehicleRows,
      fuelEntries: fuelRows,
      maintenanceEntries: maintenanceRows,
      documents: documentRows,
      isDemo: false,
    }) as unknown as FleetData;
  } catch (error) {
    console.error("Não foi possível carregar a Neon; a usar dados de demonstração.", error);
    return demoFleetData;
  }
}
