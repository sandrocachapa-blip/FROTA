import "dotenv/config";
import { demoFleetData } from "../demo-data";
import { getDb } from ".";
import { fuelEntries, maintenanceEntries, vehicleDocuments, vehicles } from "./schema";

async function seed() {
  if (!process.env.DATABASE_URL) throw new Error("Defina DATABASE_URL antes de executar o seed.");
  const db = getDb();

  await db.delete(vehicleDocuments);
  await db.delete(maintenanceEntries);
  await db.delete(fuelEntries);
  await db.delete(vehicles);

  await db.insert(vehicles).values(
    demoFleetData.vehicles.map(({ createdAt, updatedAt, ...vehicle }) => ({
      ...vehicle,
      createdAt: new Date(createdAt),
      updatedAt: new Date(updatedAt),
    })),
  );
  await db.insert(fuelEntries).values(
    demoFleetData.fuelEntries.map(({ createdAt, ...entry }) => ({ ...entry, createdAt: new Date(createdAt) })),
  );
  await db.insert(maintenanceEntries).values(
    demoFleetData.maintenanceEntries.map(({ createdAt, updatedAt, ...entry }) => ({
      ...entry,
      createdAt: new Date(createdAt),
      updatedAt: new Date(updatedAt),
    })),
  );
  await db.insert(vehicleDocuments).values(
    demoFleetData.documents.map(({ createdAt, ...document }) => ({
      ...document,
      createdAt: new Date(createdAt),
    })),
  );

  console.log("Dados de demonstração inseridos com sucesso.");
}

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});
