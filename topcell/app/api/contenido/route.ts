import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET - Obtener contenido de la tienda (logo, hero, banners, etc.)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const tipo = searchParams.get("tipo"); // "logo", "hero", "banner", etc.

    const where: any = {
      activo: true,
    };

    if (tipo) {
      where.tipo = tipo;
    }

    const contenido = await prisma.contenidoTienda.findMany({
      where,
      orderBy: [
        { orden: "asc" },
        { createdAt: "desc" },
      ],
    });

    return NextResponse.json(contenido);
  } catch (error: any) {
    console.error("Error al obtener contenido:", error);
    return NextResponse.json(
      { error: "Error al obtener contenido" },
      { status: 500 }
    );
  }
}

