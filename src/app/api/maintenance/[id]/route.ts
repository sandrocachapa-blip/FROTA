import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { databaseRequired, apiError } from "@/lib/api";
import { getDb } from "@/lib/db";
import { maintenanceEntries } from "@/lib/db/schema";
import { maintenanceEntrySchema } from "@/lib/validation";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: RouteContext) {
  const unavailable = databaseRequired();
  if (unavailable) return unavailable;
  try {
    const { id } = await params;
    const data = maintenanceEntrySchema.partial().parse(await request.json());
    const [entry] = await getDb()
      .update(maintenanceEntries)
      .set({
        ...data,
        cost: data.cost === undefined ? undefined : String(data.cost),
        updatedAt: new Date(),
      })
      .where(eq(maintenanceEntries.id, id))
      .returning();
    return NextResponse.json(entry);
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(_: Request, { params }: RouteContext) {
  const unavailable = databaseRequired();
  if (unavailable) return unavailable;
  try {
    const { id } = await params;
    await getDb().delete(maintenanceEntries).where(eq(maintenanceEntries.id, id));
    return NextResponse.json({ ok: true });
  } catch (error) {
    return apiError(error);
  }
}

