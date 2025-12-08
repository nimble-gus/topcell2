import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const videoContent = await prisma.contenidoTienda.findFirst({
      where: {
        tipo: "mayoristas-video",
        activo: true,
      },
      orderBy: {
        orden: "asc",
      },
    });

    return NextResponse.json({ url: videoContent?.urlDestino || null });
  } catch (error: any) {
    console.error("Error al obtener video de mayoristas:", error);
    return NextResponse.json(
      { error: "Error al obtener video" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { url } = body;

    if (!url || !url.trim()) {
      return NextResponse.json(
        { error: "La URL del video es requerida" },
        { status: 400 }
      );
    }

    // Buscar si ya existe un contenido de video
    const existing = await prisma.contenidoTienda.findFirst({
      where: {
        tipo: "mayoristas-video",
      },
    });

    let videoContent;
    if (existing) {
      videoContent = await prisma.contenidoTienda.update({
        where: { id: existing.id },
        data: {
          urlDestino: url.trim(),
          activo: true,
        },
      });
    } else {
      videoContent = await prisma.contenidoTienda.create({
        data: {
          tipo: "mayoristas-video",
          url: "", // No se usa para este tipo
          urlDestino: url.trim(),
          activo: true,
          orden: 0,
        },
      });
    }

    return NextResponse.json(videoContent);
  } catch (error: any) {
    console.error("Error al actualizar video de mayoristas:", error);
    return NextResponse.json(
      { error: "Error al actualizar video" },
      { status: 500 }
    );
  }
}

