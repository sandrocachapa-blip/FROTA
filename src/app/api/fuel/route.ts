import { NextResponse } from "next/server";
import { databaseRequired, apiError } from "@/lib/api";
import { getDb } from "@/lib/db";
import { fuelEntries, vehicles } from "@/lib/db/schema";
import { fuelEntrySchema } from "@/lib/validation";
import { eq } from "drizzle-orm";

export async function POST(request: Request) {
  const unavailable = databaseRequired();
  if (unavailable) return unavailable;

  try {
    const data = fuelEntrySchema.parse(await request.json());
    const db = getDb();
    const [entry] = await db
      .insert(fuelEntries)
      .values({
        ...data,
        liters: String(data.liters),
        totalCost: String(data.totalCost),
      })
      .returning();

    await db
      .update(vehicles)
      .set({ mileage: data.mileage, updatedAt: new Date() })
      .where(eq(vehicles.id, data.vehicleId));

    return NextResponse.json(entry, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}

