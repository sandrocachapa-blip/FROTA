import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { databaseRequired, apiError } from "@/lib/api";
import { getDb } from "@/lib/db";
import { fuelEntries } from "@/lib/db/schema";

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const unavailable = databaseRequired();
  if (unavailable) return unavailable;
  try {
    const { id } = await params;
    await getDb().delete(fuelEntries).where(eq(fuelEntries.id, id));
    return NextResponse.json({ ok: true });
  } catch (error) {
    return apiError(error);
  }
}

