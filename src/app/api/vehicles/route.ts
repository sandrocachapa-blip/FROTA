import { NextResponse } from "next/server";
import { databaseRequired, apiError } from "@/lib/api";
import { getDb } from "@/lib/db";
import { vehicles } from "@/lib/db/schema";
import { vehicleSchema } from "@/lib/validation";

export async function POST(request: Request) {
  const unavailable = databaseRequired();
  if (unavailable) return unavailable;

  try {
    const data = vehicleSchema.parse(await request.json());
    const [vehicle] = await getDb()
      .insert(vehicles)
      .values({
        ...data,
        acquisitionValue:
          data.acquisitionValue === null || data.acquisitionValue === undefined
            ? null
            : String(data.acquisitionValue),
      })
      .returning();

    return NextResponse.json(vehicle, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}

