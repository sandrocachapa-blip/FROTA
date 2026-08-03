import { NextResponse } from "next/server";
import { databaseRequired, apiError } from "@/lib/api";
import { getDb } from "@/lib/db";
import { vehicleDocuments } from "@/lib/db/schema";
import { documentSchema } from "@/lib/validation";

export async function POST(request: Request) {
  const unavailable = databaseRequired();
  if (unavailable) return unavailable;
  try {
    const data = documentSchema.parse(await request.json());
    const [document] = await getDb().insert(vehicleDocuments).values(data).returning();
    return NextResponse.json(document, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}

