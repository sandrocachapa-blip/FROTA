import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { hasDatabase } from "./db";

export function databaseRequired() {
  if (hasDatabase) return null;

  return NextResponse.json(
    {
      error:
        "A aplicação está em modo de demonstração. Configure DATABASE_URL com a ligação Neon para guardar alterações.",
    },
    { status: 503 },
  );
}

export function apiError(error: unknown) {
  if (error instanceof ZodError) {
    return NextResponse.json(
      { error: "Existem campos inválidos.", fields: error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  console.error(error);
  return NextResponse.json(
    { error: error instanceof Error ? error.message : "Ocorreu um erro inesperado." },
    { status: 500 },
  );
}

