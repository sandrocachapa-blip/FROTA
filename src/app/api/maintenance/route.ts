import { NextResponse } from "next/server";
import { databaseRequired, apiError } from "@/lib/api";
import { getDb } from "@/lib/db";
import { maintenanceEntries } from "@/lib/db/schema";
import { maintenanceEntrySchema } from "@/lib/validation";

export async function POST(request: Request) {
  const unavailable = databaseRequired();
  if (unavailable) return unavailable;

  try {
    const data = maintenanceEntrySchema.parse(await request.json());
    const [entry] = await getDb()
      .insert(maintenanceEntries)
      .values({ ...data, cost: String(data.cost) })
      .returning();
    return NextResponse.json(entry, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}

