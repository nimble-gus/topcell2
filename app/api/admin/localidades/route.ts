import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const localidades = await prisma.localidad.findMany({
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

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const {
      imagenUrl,
      titulo,
      direccion,
      telefono,
      horario,
      linkGoogleMaps,
      linkWaze,
      orden,
    } = body;

    // Validar campos requeridos
    if (!imagenUrl || !titulo || !direccion) {
      return NextResponse.json(
        { error: "Faltan campos requeridos: imagen, título y dirección" },
        { status: 400 }
      );
    }

    const localidad = await prisma.localidad.create({
      data: {
        imagenUrl,
        titulo: titulo.trim(),
        direccion: direccion.trim(),
        telefono: telefono?.trim() || null,
        horario: horario?.trim() || null,
        linkGoogleMaps: linkGoogleMaps?.trim() || null,
        linkWaze: linkWaze?.trim() || null,
        orden: orden || 0,
      },
    });

    return NextResponse.json(localidad, { status: 201 });
  } catch (error: any) {
    console.error("Error al crear localidad:", error);
    return NextResponse.json(
      { error: error.message || "Error al crear localidad" },
      { status: 500 }
    );
  }
}

