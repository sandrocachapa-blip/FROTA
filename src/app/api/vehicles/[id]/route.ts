import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { databaseRequired, apiError } from "@/lib/api";
import { getDb } from "@/lib/db";
import { vehicles } from "@/lib/db/schema";
import { vehicleSchema } from "@/lib/validation";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: RouteContext) {
  const unavailable = databaseRequired();
  if (unavailable) return unavailable;

  try {
    const { id } = await params;
    const data = vehicleSchema.partial().parse(await request.json());
    const [vehicle] = await getDb()
      .update(vehicles)
      .set({
        ...data,
        acquisitionValue:
          data.acquisitionValue === null || data.acquisitionValue === undefined
            ? data.acquisitionValue
            : String(data.acquisitionValue),
        updatedAt: new Date(),
      })
      .where(eq(vehicles.id, id))
      .returning();

    if (!vehicle) return NextResponse.json({ error: "Viatura não encontrada." }, { status: 404 });
    return NextResponse.json(vehicle);
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(_: Request, { params }: RouteContext) {
  const unavailable = databaseRequired();
  if (unavailable) return unavailable;

  try {
    const { id } = await params;
    const [vehicle] = await getDb()
      .delete(vehicles)
      .where(eq(vehicles.id, id))
      .returning({ id: vehicles.id });

    if (!vehicle) return NextResponse.json({ error: "Viatura não encontrada." }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return apiError(error);
  }
}

