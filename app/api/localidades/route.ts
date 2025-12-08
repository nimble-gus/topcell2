import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const localidades = await prisma.localidad.findMany({
      where: {
        activo: true,
      },
      orderBy: [
        { orden: "asc" },
        { createdAt: "desc" },
      ],
    });

    return NextResponse.json(localidades);
  } catch (error: any) {
    console.error("Error al obtener localidades:", error);
    return NextResponse.json(
      { error: "Error al obtener localidades" },
      { status: 500 }
    );
  }
}

